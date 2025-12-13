// Using global supabase and d3 loaded via UMD scripts in index.html
const { createClient } = supabase;

const $ = (selector) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
};

const views = {
  configMissing: $("#configMissingView"),
  auth: $("#authView"),
  recovery: $("#recoveryView"),
  updatePassword: $("#updatePasswordView"),
  app: $("#appView"),
};

const elements = {
  sessionPill: $("#sessionPill"),
  logoutButton: $("#logoutButton"),

  authForm: $("#authForm"),
  usernameInput: $("#usernameInput"),
  passwordInput: $("#passwordInput"),
  authStatus: $("#authStatus"),
  forgotPasswordLink: $("#forgotPasswordLink"),

  recoveryForm: $("#recoveryForm"),
  recoveryUsernameInput: $("#recoveryUsernameInput"),
  recoveryStatus: $("#recoveryStatus"),
  backToLoginLink: $("#backToLoginLink"),

  updatePasswordForm: $("#updatePasswordForm"),
  newPasswordInput: $("#newPasswordInput"),
  confirmPasswordInput: $("#confirmPasswordInput"),
  updatePasswordStatus: $("#updatePasswordStatus"),

  navGraph: $("#navGraph"),
  navNotes: $("#navNotes"),
  panelTitle: $("#panelTitle"),
  panelSubtitle: $("#panelSubtitle"),
  refreshButton: $("#refreshButton"),

  graphView: $("#graphView"),
  graphSvg: $("#graphSvg"),
  graphTooltip: $("#graphTooltip"),
  graphStatus: $("#graphStatus"),

  notesView: $("#notesView"),
  notesTextarea: $("#notesTextarea"),
  saveNotesButton: $("#saveNotesButton"),
  notesStatus: $("#notesStatus"),
};

const state = {
  supabase: null,
  config: null,
  page: "graph",
  profile: null,
  graph: {
    destroy: null,
  },
  notes: {
    loaded: false,
  },
};

function showOnly(viewKey) {
  for (const [key, node] of Object.entries(views)) {
    node.classList.toggle("hidden", key !== viewKey);
  }
}

function setStatus(element, message, kind = "muted") {
  element.textContent = message || "";
  element.classList.toggle("error", kind === "error");
  element.classList.toggle("success", kind === "success");
}

function normalizePhoneNumber(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^\d+]/g, "").replace(/\+/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return trimmed;
}

function usernameToEmail(username) {
  const input = String(username || "").trim();
  if (!input) return "";
  if (input.includes("@")) return input;

  const normalizedPhone = normalizePhoneNumber(input);
  const digits = normalizedPhone.replace(/[^\d]/g, "");
  const domain = state.config?.auth?.phoneUsernameEmailDomain || "users.franklink.ai";
  return `${digits}@${domain}`;
}

function isRecoveryUrl() {
  return window.location.hash.includes("type=recovery");
}

function clearUrlHash() {
  if (!window.location.hash) return;
  history.replaceState(null, "", window.location.pathname + window.location.search);
}

function requireConfig() {
  if (window.__FRANKLINK_DASHBOARD_CONFIG_MISSING__ || !window.FRANKLINK_DASHBOARD_CONFIG) {
    showOnly("configMissing");
    return false;
  }

  const config = window.FRANKLINK_DASHBOARD_CONFIG;
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    showOnly("configMissing");
    return false;
  }

  state.config = config;
  state.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return true;
}

async function refreshSessionPill(sessionOverride) {
  let session = sessionOverride;
  if (!session) {
    const { data } = await state.supabase.auth.getSession();
    session = data.session;
  }
  if (!session) {
    elements.sessionPill.textContent = "Not signed in";
    elements.logoutButton.classList.add("hidden");
    return;
  }
  elements.sessionPill.textContent = "Signed in";
  elements.logoutButton.classList.remove("hidden");
}

async function loadProfile() {
  const { data: userData, error: userError } = await state.supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData?.user) return null;

  const usersTable = state.config?.tables?.users || "users";
  const { data, error } = await state.supabase
    .from(usersTable)
    .select("id, name, phone_number")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to load users row from '${usersTable}': ${error.message}`);
  }

  state.profile = data || { id: userData.user.id };
  return state.profile;
}

function setPage(page) {
  state.page = page;
  const isGraph = page === "graph";

  elements.navGraph.setAttribute("aria-current", isGraph ? "page" : "false");
  elements.navNotes.setAttribute("aria-current", !isGraph ? "page" : "false");

  elements.graphView.classList.toggle("hidden", !isGraph);
  elements.notesView.classList.toggle("hidden", isGraph === true);

  if (isGraph) {
    elements.panelTitle.textContent = "Connection Graph";
    elements.panelSubtitle.textContent = "Your network visualized as an interactive graph. Drag bubbles to explore.";
    elements.refreshButton.classList.remove("hidden");
  } else {
    elements.panelTitle.textContent = "Career Notes";
    elements.panelSubtitle.textContent = "A lightweight notebook for career thoughts, follow-ups, and plans.";
    elements.refreshButton.classList.add("hidden");
  }
}

async function ensureNotes() {
  setStatus(elements.notesStatus, "Loading notes…");

  try {
    const careerNotesTable = state.config?.tables?.careerNotes || "career_notes";
    const { data: userData, error: userError } = await state.supabase.auth.getUser();
    if (userError) throw userError;

    const authUserId = userData?.user?.id;
    if (!authUserId) throw new Error("Not signed in.");

    const { data, error } = await state.supabase
      .from(careerNotesTable)
      .select("body, updated_at")
      .eq("user_id", authUserId)
      .maybeSingle();

    if (error) throw new Error(`Failed to load '${careerNotesTable}': ${error.message}`);

    elements.notesTextarea.value = data?.body || "";
    if (data?.updated_at) {
      const when = new Date(data.updated_at).toLocaleString();
      setStatus(elements.notesStatus, `Loaded. Last saved: ${when}`);
    } else {
      setStatus(elements.notesStatus, "No notes yet. Write something and hit Save.");
    }

    state.notes.loaded = true;
  } catch (err) {
    setStatus(elements.notesStatus, err?.message || String(err), "error");
  }
}

async function saveNotes() {
  setStatus(elements.notesStatus, "Saving…");

  try {
    const careerNotesTable = state.config?.tables?.careerNotes || "career_notes";
    const { data: userData, error: userError } = await state.supabase.auth.getUser();
    if (userError) throw userError;

    const authUserId = userData?.user?.id;
    if (!authUserId) throw new Error("Not signed in.");

    const body = String(elements.notesTextarea.value || "");
    const payload = { user_id: authUserId, body, updated_at: new Date().toISOString() };

    const { error } = await state.supabase.from(careerNotesTable).upsert(payload, { onConflict: "user_id" });
    if (error) throw new Error(`Failed to save '${careerNotesTable}': ${error.message}`);

    setStatus(elements.notesStatus, "Saved.", "success");
  } catch (err) {
    setStatus(elements.notesStatus, err?.message || String(err), "error");
  }
}

function renderGraph(nodes, links) {
  if (state.graph.destroy) state.graph.destroy();

  const svg = d3.select(elements.graphSvg);
  svg.selectAll("*").remove();

  const wrap = elements.graphSvg.parentElement;
  const tooltip = elements.graphTooltip;

  const width = wrap.clientWidth || 900;
  const height = wrap.clientHeight || 520;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const centerNode = nodes.find((n) => n.id === "me");
  if (centerNode) {
    centerNode.fx = width / 2;
    centerNode.fy = height / 2;
  }

  // Franklink-style SVG definitions (matching logo aesthetic)
  const defs = svg.append("defs");

  // Center node gradient (Franklink deep blue - matches logo center)
  const centerGradient = defs.append("radialGradient")
    .attr("id", "centerGradient")
    .attr("cx", "30%")
    .attr("cy", "30%");
  centerGradient.append("stop").attr("offset", "0%").attr("stop-color", "#60a5fa");
  centerGradient.append("stop").attr("offset", "35%").attr("stop-color", "#3b82f6");
  centerGradient.append("stop").attr("offset", "100%").attr("stop-color", "#1d4ed8");

  // Connection node gradient (Franklink purple-blue - matches logo orbital dots)
  const nodeGradient = defs.append("radialGradient")
    .attr("id", "nodeGradient")
    .attr("cx", "30%")
    .attr("cy", "30%");
  nodeGradient.append("stop").attr("offset", "0%").attr("stop-color", "#a78bfa");
  nodeGradient.append("stop").attr("offset", "35%").attr("stop-color", "#8b5cf6");
  nodeGradient.append("stop").attr("offset", "100%").attr("stop-color", "#6d28d9");

  // Soft outer glow filter for hover
  const glow = defs.append("filter")
    .attr("id", "glow")
    .attr("x", "-80%")
    .attr("y", "-80%")
    .attr("width", "260%")
    .attr("height", "260%");
  glow.append("feGaussianBlur").attr("stdDeviation", "8").attr("result", "blur");
  const glowMerge = glow.append("feMerge");
  glowMerge.append("feMergeNode").attr("in", "blur");
  glowMerge.append("feMergeNode").attr("in", "SourceGraphic");

  // Drop shadow filter for nodes (blue-tinted like logo)
  const dropShadow = defs.append("filter")
    .attr("id", "dropShadow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");
  dropShadow.append("feDropShadow")
    .attr("dx", "0")
    .attr("dy", "4")
    .attr("stdDeviation", "8")
    .attr("flood-color", "rgba(59, 130, 246, 0.3)");

  // Gradient for links (Franklink blue to purple)
  const linkGradient = defs.append("linearGradient")
    .attr("id", "linkGradient")
    .attr("gradientUnits", "userSpaceOnUse");
  linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "rgba(59, 130, 246, 0.5)");
  linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "rgba(139, 92, 246, 0.3)");

  // Link layer
  const linkLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  // Premium physics simulation - smooth and organic
  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3.forceLink(links)
        .id((d) => d.id)
        .distance(180)
        .strength(0.2),
    )
    .force("charge", d3.forceManyBody().strength(-450))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius((d) => d.radius + 35).strength(0.8))
    .alphaDecay(0.012)
    .velocityDecay(0.32);

  // Links with gradient
  const link = linkLayer
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", "url(#linkGradient)")
    .attr("stroke-width", 2.5)
    .attr("stroke-linecap", "round")
    .attr("opacity", 0.8);

  // Node groups
  const node = nodeLayer
    .selectAll("g")
    .data(nodes)
    .enter()
    .append("g")
    .style("cursor", (d) => d.id === "me" ? "default" : "grab")
    .call(
      d3.drag()
        .on("start", (event, d) => {
          if (d.id === "me") return;
          d3.select(event.sourceEvent.target.parentNode).style("cursor", "grabbing");
          if (!event.active) simulation.alphaTarget(0.15).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          if (d.id === "me") return;
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (d.id === "me") return;
          d3.select(event.sourceEvent.target.parentNode).style("cursor", "grab");
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }),
    );

  // Create clip paths for circular logo masks
  nodes.forEach((d, i) => {
    defs.append("clipPath")
      .attr("id", `clip-${i}`)
      .append("circle")
      .attr("r", d.radius);
  });

  // Soft glow behind logo nodes
  node
    .append("circle")
    .attr("class", "node-glow")
    .attr("r", (d) => d.radius + 4)
    .attr("fill", (d) => d.id === "me" ? "rgba(59, 130, 246, 0.15)" : "rgba(139, 92, 246, 0.12)")
    .attr("filter", "url(#dropShadow)");

  // White background circle for logo visibility
  node
    .append("circle")
    .attr("class", "node-bg")
    .attr("r", (d) => d.radius)
    .attr("fill", "white");

  // Franklink logo as the node (clipped to circle)
  node
    .append("image")
    .attr("class", "node-logo")
    .attr("href", "./franklink-logo.png")
    .attr("x", (d) => -d.radius)
    .attr("y", (d) => -d.radius)
    .attr("width", (d) => d.radius * 2)
    .attr("height", (d) => d.radius * 2)
    .attr("clip-path", (d, i) => `url(#clip-${i})`)
    .attr("preserveAspectRatio", "xMidYMid slice");

  // Color overlay for differentiation (center = blue tint, connections = purple tint)
  node
    .append("circle")
    .attr("class", "node-circle")
    .attr("r", (d) => d.radius)
    .attr("fill", (d) => d.id === "me" ? "rgba(59, 130, 246, 0.25)" : "rgba(139, 92, 246, 0.2)");

  // Outer ring border
  node
    .append("circle")
    .attr("r", (d) => d.radius)
    .attr("fill", "none")
    .attr("stroke", (d) => d.id === "me" ? "rgba(59, 130, 246, 0.5)" : "rgba(139, 92, 246, 0.4)")
    .attr("stroke-width", 2.5);

  // Decorative outer ring for center node
  node.filter((d) => d.id === "me")
    .append("circle")
    .attr("r", (d) => d.radius + 10)
    .attr("fill", "none")
    .attr("stroke", "rgba(59, 130, 246, 0.3)")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "5 4");

  // Name badge background (pill shape below the logo)
  node
    .append("rect")
    .attr("class", "name-badge-bg")
    .attr("x", (d) => -Math.max(d.shortLabel.length * 4.5, 24))
    .attr("y", (d) => d.radius + 6)
    .attr("width", (d) => Math.max(d.shortLabel.length * 9, 48))
    .attr("height", 22)
    .attr("rx", 11)
    .attr("ry", 11)
    .attr("fill", (d) => d.id === "me" ? "rgba(59, 130, 246, 0.95)" : "rgba(139, 92, 246, 0.9)")
    .attr("filter", "url(#dropShadow)");

  // Label text on the badge
  node
    .append("text")
    .attr("class", "name-label")
    .attr("text-anchor", "middle")
    .attr("y", (d) => d.radius + 21)
    .attr("fill", "white")
    .attr("font-size", 12)
    .attr("font-weight", 600)
    .attr("font-family", "Inter, system-ui, sans-serif")
    .attr("letter-spacing", "-0.01em")
    .style("pointer-events", "none")
    .text((d) => d.shortLabel);

  // Enhanced hover effects with focus mode
  node
    .on("mouseenter", function(event, d) {
      // Scale up entire node group
      d3.select(this)
        .transition()
        .duration(200)
        .ease(d3.easeCubicOut)
        .attr("transform", `translate(${d.x},${d.y}) scale(1.08)`);

      // Enhance glow
      d3.select(this).select(".node-glow")
        .transition()
        .duration(200)
        .attr("r", d.radius + 8)
        .attr("fill", d.id === "me" ? "rgba(59, 130, 246, 0.3)" : "rgba(139, 92, 246, 0.25)");

      // Highlight connected links
      link.transition().duration(200)
        .attr("opacity", (l) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15)
        .attr("stroke-width", (l) => (l.source.id === d.id || l.target.id === d.id) ? 3.5 : 2);

      // Dim unconnected nodes
      node.transition().duration(200)
        .attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const connected = links.some((l) =>
            (l.source.id === d.id && l.target.id === n.id) ||
            (l.target.id === d.id && l.source.id === n.id)
          );
          return connected ? 1 : 0.35;
        });

      showTooltip(event, d);
    })
    .on("mouseleave", function(_event, d) {
      // Reset node scale
      d3.select(this)
        .transition()
        .duration(250)
        .attr("transform", `translate(${d.x},${d.y}) scale(1)`);

      // Reset glow
      d3.select(this).select(".node-glow")
        .transition()
        .duration(250)
        .attr("r", d.radius + 4)
        .attr("fill", d.id === "me" ? "rgba(59, 130, 246, 0.15)" : "rgba(139, 92, 246, 0.12)");

      // Reset all links
      link.transition().duration(250)
        .attr("opacity", 0.8)
        .attr("stroke-width", 2.5);

      // Reset all nodes
      node.transition().duration(250).attr("opacity", 1);

      hideTooltip();
    });

  function positionTooltip(nativeEvent) {
    const rect = wrap.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left + 15;
    const y = nativeEvent.clientY - rect.top - 10;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  function showTooltip(event, d) {
    tooltip.textContent = d.label;
    positionTooltip(event);
    tooltip.classList.add("visible");
  }

  function hideTooltip() {
    tooltip.classList.remove("visible");
  }

  svg.on("mousemove", (event) => {
    if (tooltip.classList.contains("visible")) {
      positionTooltip(event);
    }
  });

  simulation.on("tick", () => {
    // Update link gradient positions for each link (Franklink blue to purple)
    link.each(function(d) {
      const linkEl = d3.select(this);
      const gradId = `linkGrad-${d.source.id}-${d.target.id}`;
      let grad = defs.select(`#${gradId}`);
      if (grad.empty()) {
        grad = defs.append("linearGradient")
          .attr("id", gradId)
          .attr("gradientUnits", "userSpaceOnUse");
        grad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(59, 130, 246, 0.5)");
        grad.append("stop").attr("offset", "100%").attr("stop-color", "rgba(139, 92, 246, 0.35)");
      }
      grad.attr("x1", d.source.x).attr("y1", d.source.y)
          .attr("x2", d.target.x).attr("y2", d.target.y);
      linkEl.attr("stroke", `url(#${gradId})`);
    });

    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  const onResize = () => {
    const newWidth = wrap.clientWidth || width;
    const newHeight = wrap.clientHeight || height;
    svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);
    if (centerNode) {
      centerNode.fx = newWidth / 2;
      centerNode.fy = newHeight / 2;
    }
    simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2));
    simulation.alpha(0.3).restart();
  };

  window.addEventListener("resize", onResize);

  state.graph.destroy = () => {
    window.removeEventListener("resize", onResize);
    simulation.stop();
  };
}

function formatShortLabel(label) {
  const text = String(label || "").trim();
  if (!text) return "—";
  if (text.startsWith("+") && text.replace(/[^\d]/g, "").length >= 11) {
    const digits = text.replace(/[^\d]/g, "");
    return `${digits.slice(-4)}`;
  }
  if (text.length <= 10) return text;
  return text.slice(0, 9) + "…";
}

function extractParticipants(row) {
  const keys = [
    "participants",
    "participant_phone_numbers",
    "participant_numbers",
    "participant_ids",
    "participant_user_ids",
    "members",
    "member_ids",
    "people",
    "contacts",
  ];

  for (const key of keys) {
    const value = row?.[key];
    if (!value) continue;

    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const parts = value.split(/[,\n]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length) return parts;
    }
  }

  return [];
}

function normalizeParticipant(participant) {
  if (participant == null) return null;
  if (typeof participant === "string") return participant.trim();
  if (typeof participant === "number") return String(participant);
  if (typeof participant === "object") {
    return (
      participant.phone_number ||
      participant.phone ||
      participant.number ||
      participant.username ||
      participant.id ||
      participant.user_id ||
      null
    );
  }
  return null;
}

async function loadGraphData() {
  const groupChatsTable = state.config?.tables?.groupChats || "group_chats";
  const usersTable = state.config?.tables?.users || "users";

  const { data: userData } = await state.supabase.auth.getUser();
  const authUserId = userData?.user?.id;
  if (!authUserId) throw new Error("No authenticated user found.");

  // Prioritize name over phone number for center label
  const centerLabel = state.profile?.name || state.profile?.phone_number || "You";

  // Fetch chats where user is user_a
  const { data: chatsAsA, error: errorA } = await state.supabase
    .from(groupChatsTable)
    .select("user_a_id, user_b_id")
    .eq("user_a_id", authUserId)
    .limit(250);

  // Fetch chats where user is user_b
  const { data: chatsAsB, error: errorB } = await state.supabase
    .from(groupChatsTable)
    .select("user_a_id, user_b_id")
    .eq("user_b_id", authUserId)
    .limit(250);

  if (errorA) console.warn("Error loading chats as user_a:", errorA);
  if (errorB) console.warn("Error loading chats as user_b:", errorB);

  // Combine results and extract unique connection IDs
  const chats = [...(chatsAsA || []), ...(chatsAsB || [])];
  const connectionIds = new Set();

  for (const row of chats) {
    const otherId = row.user_a_id === authUserId ? row.user_b_id : row.user_a_id;
    if (otherId && otherId !== authUserId) {
      connectionIds.add(otherId);
    }
  }

  const ids = [...connectionIds].slice(0, 120);

  // Fetch names for all connection IDs
  let connectionUsers = [];
  if (ids.length > 0) {
    const { data, error } = await state.supabase
      .from(usersTable)
      .select("id, name, phone_number")
      .in("id", ids);
    if (error) console.warn("Error loading user names:", error);
    connectionUsers = data || [];
  }

  // Create a map of id -> display name
  const nameMap = new Map();
  for (const user of connectionUsers) {
    const displayName = user.name || formatPhoneDisplay(user.phone_number) || "Unknown";
    nameMap.set(user.id, displayName);
  }

  const nodes = [
    { id: "me", label: centerLabel, shortLabel: centerLabel, radius: 44 },
    ...ids.map((id) => ({
      id: String(id),
      label: nameMap.get(id) || "Unknown",
      shortLabel: nameMap.get(id) || "?",
      radius: 34,
    })),
  ];

  const links = ids.map((id) => ({
    source: "me",
    target: String(id),
  }));

  return { nodes, links, count: ids.length };
}

function formatPhoneDisplay(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

async function ensureGraph() {
  setStatus(elements.graphStatus, "Loading connections…");
  console.log("ensureGraph: starting");

  try {
    await loadProfile();
    console.log("ensureGraph: profile loaded", state.profile);
  } catch (err) {
    console.error("ensureGraph: profile error", err);
    setStatus(elements.graphStatus, err?.message || String(err), "error");
    renderGraph(
      [{ id: "me", label: "You", shortLabel: "You", radius: 26 }],
      [],
    );
    return;
  }

  try {
    const { nodes, links, count } = await loadGraphData();
    console.log("ensureGraph: data loaded", { nodeCount: nodes.length, linkCount: links.length });
    renderGraph(nodes, links);
    setStatus(elements.graphStatus, count ? `${count} connections loaded.` : "No connections found yet.");
    console.log("ensureGraph: complete");
  } catch (err) {
    console.error("ensureGraph: data error", err);
    setStatus(elements.graphStatus, err?.message || String(err), "error");
    renderGraph(
      [{ id: "me", label: "You", shortLabel: "You", radius: 26 }],
      [],
    );
  }
}

async function showApp() {
  console.log("showApp called");
  showOnly("app");
  console.log("showOnly('app') done");
  setPage(state.page);
  console.log("setPage done, page:", state.page);
  await refreshSessionPill();
  console.log("refreshSessionPill done");
  try {
    if (state.page === "graph") await ensureGraph();
    if (state.page === "notes") await ensureNotes();
    console.log("App view fully loaded");
  } catch (err) {
    console.error("Error loading app view:", err);
  }
}

async function showAuth() {
  showOnly("auth");
  await refreshSessionPill();
  elements.usernameInput.focus();
}

async function handleRoute() {
  if (!requireConfig()) return;

  const { data } = await state.supabase.auth.getSession();
  if (isRecoveryUrl()) {
    showOnly("updatePassword");
    await refreshSessionPill();
    return;
  }

  if (!data.session) {
    await showAuth();
    return;
  }

  await showApp();
}

elements.forgotPasswordLink.addEventListener("click", (event) => {
  event.preventDefault();
  showOnly("recovery");
  setStatus(elements.recoveryStatus, "");
  elements.recoveryUsernameInput.value = elements.usernameInput.value || "";
  elements.recoveryUsernameInput.focus();
});

elements.backToLoginLink.addEventListener("click", (event) => {
  event.preventDefault();
  showOnly("auth");
  setStatus(elements.authStatus, "");
  elements.usernameInput.focus();
});

elements.logoutButton.addEventListener("click", async () => {
  if (!state.supabase) return;
  await state.supabase.auth.signOut();
  state.profile = null;
  await refreshSessionPill();
  showOnly("auth");
});

elements.authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.log("Form submitted");
  setStatus(elements.authStatus, "Signing in…");

  try {
    if (!state.supabase) {
      throw new Error("Supabase not initialized. Check config.");
    }
    const email = usernameToEmail(elements.usernameInput.value);
    const password = elements.passwordInput.value;
    console.log("Attempting login with:", email);
    if (!email || !password) throw new Error("Username and password are required.");

    const { error } = await state.supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    console.log("Login successful, showing app...");
    setStatus(elements.authStatus, "Signed in.", "success");
    await showApp();
  } catch (err) {
    console.error("Login error:", err);
    setStatus(elements.authStatus, err?.message || String(err), "error");
  }
});

elements.recoveryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(elements.recoveryStatus, "Sending reset link…");

  try {
    const email = usernameToEmail(elements.recoveryUsernameInput.value);
    if (!email) throw new Error("Username or email is required.");

    const redirectTo = `${window.location.origin}/dashboard/`;
    const { error } = await state.supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
    setStatus(elements.recoveryStatus, "If an account exists, a reset link was sent.", "success");
  } catch (err) {
    setStatus(elements.recoveryStatus, err?.message || String(err), "error");
  }
});

elements.updatePasswordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(elements.updatePasswordStatus, "Updating password…");

  try {
    const newPassword = elements.newPasswordInput.value;
    const confirmPassword = elements.confirmPasswordInput.value;

    if (newPassword.length < 8) throw new Error("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) throw new Error("Passwords do not match.");

    const { error } = await state.supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setStatus(elements.updatePasswordStatus, "Password updated. You’re signed in.", "success");
    clearUrlHash();
    await showApp();
  } catch (err) {
    setStatus(elements.updatePasswordStatus, err?.message || String(err), "error");
  }
});

elements.navGraph.addEventListener("click", async () => {
  setPage("graph");
  await ensureGraph();
});

elements.navNotes.addEventListener("click", async () => {
  setPage("notes");
  await ensureNotes();
});

elements.refreshButton.addEventListener("click", async () => {
  await ensureGraph();
});

elements.saveNotesButton.addEventListener("click", async () => {
  await saveNotes();
});

if (requireConfig()) {
  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    await refreshSessionPill(session);
    if (isRecoveryUrl()) return;
    if (!session) showOnly("auth");
  });
}

handleRoute().catch((err) => {
  showOnly("auth");
  setStatus(elements.authStatus, err?.message || String(err), "error");
});
