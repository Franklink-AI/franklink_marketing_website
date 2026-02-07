// Franklink Account Section
// Auth, profile, avatar upload, connection graph

const { createClient } = supabase;

// ==================== HELPERS ====================

const $ = (sel) => {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`Missing element: ${sel}`);
  return el;
};

// ==================== CONFIG & STATE ====================

const config = window.FRANKLINK_CONFIG;
const sb = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

const state = {
  profile: null,
  tab: "profile",
  graph: { destroy: null },
  avatarPreviewUrl: null,
  avatarPreviewFile: null,
};

// ==================== DOM REFS ====================

const el = {
  loginView: $("#loginView"),
  appView: $("#appView"),
  loginForm: $("#loginForm"),
  identityInput: $("#identityInput"),
  passwordInput: $("#passwordInput"),
  loginButton: $("#loginButton"),
  loginStatus: $("#loginStatus"),

  tabProfile: $("#tabProfile"),
  tabConnections: $("#tabConnections"),
  profilePanel: $("#profilePanel"),
  graphPanel: $("#graphPanel"),
  logoutButton: $("#logoutButton"),

  avatarWrapper: $("#avatarWrapper"),
  avatarCircle: $("#avatarCircle"),
  avatarImg: $("#avatarImg"),
  avatarInitials: $("#avatarInitials"),
  avatarFileInput: $("#avatarFileInput"),
  avatarActions: $("#avatarActions"),
  avatarSaveBtn: $("#avatarSaveBtn"),
  avatarCancelBtn: $("#avatarCancelBtn"),
  changePhotoLink: $("#changePhotoLink"),
  avatarStatus: $("#avatarStatus"),

  profileName: $("#profileName"),
  infoSchool: $("#infoSchool"),
  gradYearPills: $("#gradYearPills"),
  gradYearStatus: $("#gradYearStatus"),

  changePasswordToggle: $("#changePasswordToggle"),
  passwordForm: $("#passwordForm"),
  currentPasswordInput: $("#currentPasswordInput"),
  newPasswordInput: $("#newPasswordInput"),
  confirmPasswordInput: $("#confirmPasswordInput"),
  updatePasswordBtn: $("#updatePasswordBtn"),
  cancelPasswordBtn: $("#cancelPasswordBtn"),
  passwordStatus: $("#passwordStatus"),

  connectionCount: $("#connectionCount"),
  graphContainer: $("#graphContainer"),
  graphSvg: $("#graphSvg"),
  graphTooltip: $("#graphTooltip"),
  graphEmptyState: $("#graphEmptyState"),
  graphStatus: $("#graphStatus"),
};

// ==================== UTILITIES ====================

function normalizePhoneNumber(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return "";
  const digits = trimmed.replace(/[^\d+]/g, "").replace(/\+/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 11) return `+${digits}`;
  return trimmed;
}

function usernameToEmail(input) {
  const trimmed = String(input || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("@")) return trimmed;
  const normalized = normalizePhoneNumber(trimmed);
  const digits = normalized.replace(/[^\d]/g, "");
  const domain = config.auth?.phoneUsernameEmailDomain || "users.franklink.ai";
  return `${digits}@${domain}`;
}

function setStatus(element, message, kind = "muted") {
  element.textContent = message || "";
  element.className = "status-message";
  if (kind === "error") element.classList.add("error");
  if (kind === "success") element.classList.add("success");
}

function formatPhoneDisplay(phone) {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length === 11 && digits.startsWith("1")) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

// Avatar color palette (same as macOS app)
const AVATAR_COLORS = ["#2563EB", "#4ECDC4", "#FF6B6B", "#95E1D3", "#FFE66D", "#A78BFA"];

function getAvatarColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash + userId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ==================== VIEW MANAGEMENT ====================

function showView(view) {
  el.loginView.classList.toggle("hidden", view !== "login");
  el.appView.classList.toggle("hidden", view !== "app");
}

function setTab(tab) {
  state.tab = tab;
  const isProfile = tab === "profile";

  el.tabProfile.classList.toggle("active", isProfile);
  el.tabProfile.setAttribute("aria-selected", isProfile);
  el.tabConnections.classList.toggle("active", !isProfile);
  el.tabConnections.setAttribute("aria-selected", !isProfile);

  el.profilePanel.classList.toggle("hidden", !isProfile);
  el.graphPanel.classList.toggle("hidden", isProfile);
}

// ==================== AUTH ====================

async function handleLogin(e) {
  e.preventDefault();
  setStatus(el.loginStatus, "Signing in...");
  el.loginButton.disabled = true;

  try {
    const rawIdentity = el.identityInput.value.trim();
    const email = usernameToEmail(rawIdentity);
    const password = el.passwordInput.value;
    if (!email || !password) throw new Error("Phone/email and password are required.");

    let result = await sb.auth.signInWithPassword({ email, password });

    // If login failed, try auto-provisioning an auth record
    if (result.error && result.error.message?.includes("Invalid login")) {
      try {
        const provRes = await fetch("/account/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identity: rawIdentity, password }),
        });
        const provData = await provRes.json();

        if (provData.provisioned) {
          // Auth record created — retry login
          result = await sb.auth.signInWithPassword({ email, password });
        }
      } catch (provErr) {
        console.warn("Provision attempt failed:", provErr);
      }
    }

    if (result.error) throw result.error;

    setStatus(el.loginStatus, "Signed in.", "success");
    await enterApp();
  } catch (err) {
    setStatus(
      el.loginStatus,
      err?.message?.includes("Invalid login")
        ? "Invalid credentials. Make sure you're using the phone number or email linked to your Frank account."
        : (err?.message || String(err)),
      "error"
    );
  } finally {
    el.loginButton.disabled = false;
  }
}

async function handleLogout() {
  await sb.auth.signOut();
  state.profile = null;
  if (state.graph.destroy) state.graph.destroy();
  showView("login");
}

// ==================== PROFILE ====================

async function loadProfile() {
  const { data: userData, error: userError } = await sb.auth.getUser();
  if (userError) throw userError;
  if (!userData?.user) return null;

  const { data, error } = await sb
    .from(config.tables.users)
    .select("id, name, phone_number, university, agent_avatar_url, graduation_year")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load profile: ${error.message}`);
  if (!data) return null; // not onboarded

  state.profile = data;
  return data;
}

function renderProfile(profile) {
  // Avatar
  if (profile.agent_avatar_url) {
    el.avatarImg.src = profile.agent_avatar_url;
    el.avatarImg.classList.remove("hidden");
    el.avatarInitials.classList.add("hidden");
  } else {
    el.avatarImg.classList.add("hidden");
    el.avatarInitials.classList.remove("hidden");
    el.avatarInitials.textContent = getInitials(profile.name);
    const color = getAvatarColor(profile.id);
    el.avatarCircle.style.background = color + "22"; // light bg
    el.avatarInitials.style.color = color;
  }

  // Name
  el.profileName.textContent = profile.name || "Unknown";

  // Info fields
  setInfoField(el.infoSchool, profile.university);

  // Graduation year pills
  renderGradYearPills(profile.graduation_year);
}

function setInfoField(element, value) {
  if (value) {
    element.textContent = value;
    element.classList.remove("empty");
  } else {
    element.textContent = "Not yet available";
    element.classList.add("empty");
  }
}

// ==================== GRADUATION YEAR ====================

function renderGradYearPills(selectedYear) {
  const container = el.gradYearPills;
  container.innerHTML = "";
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y <= currentYear + 6; y++) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "grad-year-pill";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(y === selectedYear));
    btn.textContent = String(y);
    if (y === selectedYear) btn.classList.add("selected");
    btn.addEventListener("click", () => handleGradYearPillClick(y, btn));
    container.appendChild(btn);
  }
}

async function handleGradYearPillClick(year, clickedBtn) {
  if (!state.profile) return;

  // Toggle: clicking the already-selected year deselects it
  const isDeselect = state.profile.graduation_year === year;
  const newYear = isDeselect ? null : year;

  // Optimistic UI update
  el.gradYearPills.querySelectorAll(".grad-year-pill").forEach((btn) => {
    const isSelected = !isDeselect && btn === clickedBtn;
    btn.classList.toggle("selected", isSelected);
    btn.setAttribute("aria-checked", String(isSelected));
  });

  setStatus(el.gradYearStatus, "Saving...");

  try {
    const { error } = await sb
      .from(config.tables.users)
      .update({ graduation_year: newYear })
      .eq("id", state.profile.id);

    if (error) throw error;

    state.profile.graduation_year = newYear;
    setStatus(el.gradYearStatus, "Saved", "success");
    setTimeout(() => setStatus(el.gradYearStatus, ""), 2000);
  } catch (err) {
    // Revert on failure
    renderGradYearPills(state.profile.graduation_year);
    setStatus(el.gradYearStatus, err?.message || "Failed to save.", "error");
  }
}

// ==================== AVATAR UPLOAD ====================

function openFilePicker() {
  el.avatarFileInput.click();
}

function handleFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate type
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    setStatus(el.avatarStatus, "Please choose a JPG, PNG, or WebP image.", "error");
    return;
  }

  // Validate size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    setStatus(el.avatarStatus, "Image must be under 5MB. Please choose a smaller file.", "error");
    return;
  }

  // Show preview
  state.avatarPreviewFile = file;
  state.avatarPreviewUrl = URL.createObjectURL(file);
  el.avatarImg.src = state.avatarPreviewUrl;
  el.avatarImg.classList.remove("hidden");
  el.avatarInitials.classList.add("hidden");
  el.avatarActions.classList.remove("hidden");
  el.changePhotoLink.classList.add("hidden");
  setStatus(el.avatarStatus, "");
}

function cancelAvatarUpload() {
  if (state.avatarPreviewUrl) {
    URL.revokeObjectURL(state.avatarPreviewUrl);
    state.avatarPreviewUrl = null;
    state.avatarPreviewFile = null;
  }
  el.avatarFileInput.value = "";
  el.avatarActions.classList.add("hidden");
  el.changePhotoLink.classList.remove("hidden");
  renderProfile(state.profile);
}

async function saveAvatar() {
  if (!state.avatarPreviewFile || !state.profile) return;

  const file = state.avatarPreviewFile;
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filePath = `${state.profile.id}/avatar.${ext}`;

  setStatus(el.avatarStatus, "Uploading...");
  el.avatarSaveBtn.disabled = true;

  try {
    // Upload to Supabase Storage
    const { error: uploadError } = await sb.storage
      .from("agent-avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Get public URL
    const { data: urlData } = sb.storage
      .from("agent-avatars")
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl + "?t=" + Date.now(); // cache-bust

    // Update users table
    const { error: updateError } = await sb
      .from(config.tables.users)
      .update({ agent_avatar_url: publicUrl })
      .eq("id", state.profile.id);

    if (updateError) throw new Error(`Failed to save: ${updateError.message}`);

    // Success
    state.profile.agent_avatar_url = publicUrl;
    if (state.avatarPreviewUrl) URL.revokeObjectURL(state.avatarPreviewUrl);
    state.avatarPreviewUrl = null;
    state.avatarPreviewFile = null;
    el.avatarFileInput.value = "";
    el.avatarActions.classList.add("hidden");
    el.changePhotoLink.classList.remove("hidden");

    renderProfile(state.profile);
    setStatus(el.avatarStatus, "Photo updated.", "success");
    setTimeout(() => setStatus(el.avatarStatus, ""), 3000);
  } catch (err) {
    setStatus(el.avatarStatus, err?.message || "Upload failed. Please try again.", "error");
  } finally {
    el.avatarSaveBtn.disabled = false;
  }
}

// ==================== PASSWORD CHANGE ====================

function togglePasswordForm() {
  const isHidden = el.passwordForm.classList.contains("hidden");
  el.passwordForm.classList.toggle("hidden", !isHidden);
  el.changePasswordToggle.textContent = isHidden ? "Cancel" : "Change password";
  setStatus(el.passwordStatus, "");
}

function hidePasswordForm() {
  el.passwordForm.classList.add("hidden");
  el.changePasswordToggle.textContent = "Change password";
  el.currentPasswordInput.value = "";
  el.newPasswordInput.value = "";
  el.confirmPasswordInput.value = "";
  setStatus(el.passwordStatus, "");
}

async function handleUpdatePassword() {
  const newPassword = el.newPasswordInput.value;
  const confirmPassword = el.confirmPasswordInput.value;

  if (newPassword.length < 8) {
    setStatus(el.passwordStatus, "Password must be at least 8 characters.", "error");
    return;
  }
  if (newPassword !== confirmPassword) {
    setStatus(el.passwordStatus, "Passwords do not match.", "error");
    return;
  }

  setStatus(el.passwordStatus, "Updating...");
  el.updatePasswordBtn.disabled = true;

  try {
    const { error } = await sb.auth.updateUser({ password: newPassword });
    if (error) throw error;
    setStatus(el.passwordStatus, "Password updated.", "success");
    setTimeout(() => hidePasswordForm(), 2000);
  } catch (err) {
    setStatus(el.passwordStatus, err?.message || "Failed to update password.", "error");
  } finally {
    el.updatePasswordBtn.disabled = false;
  }
}

// ==================== CONNECTION GRAPH ====================

function formatShortLabel(label) {
  const text = String(label || "").trim();
  if (!text) return "?";
  if (text.startsWith("+") && text.replace(/[^\d]/g, "").length >= 11) {
    return text.replace(/[^\d]/g, "").slice(-4);
  }
  if (text.length <= 10) return text;
  return text.slice(0, 9) + "\u2026";
}

function generateGroupName(members, myId) {
  const others = members.filter((m) => m.id !== myId);
  if (others.length === 0) return "Group Chat";
  if (others.length <= 2) return others.map((m) => m.name?.split(" ")[0] || "?").join(" & ");
  const first = others.slice(0, 2).map((m) => m.name?.split(" ")[0] || "?");
  return `${first.join(", ")} & ${others.length - 2} other${others.length - 2 > 1 ? "s" : ""}`;
}

async function loadGraphData() {
  const { data: userData } = await sb.auth.getUser();
  const authUserId = userData?.user?.id;
  if (!authUserId) throw new Error("No authenticated user.");

  const centerLabel = state.profile?.name || state.profile?.phone_number || "You";

  // Phase A: 1:1 connections from connection_requests (status = 'group_created')
  const [{ data: asInitiator, error: errI }, { data: asTarget, error: errT }] = await Promise.all([
    sb.from("connection_requests")
      .select("initiator_user_id, target_user_id")
      .eq("initiator_user_id", authUserId)
      .eq("status", "group_created")
      .limit(250),
    sb.from("connection_requests")
      .select("initiator_user_id, target_user_id")
      .eq("target_user_id", authUserId)
      .eq("status", "group_created")
      .limit(250),
  ]);

  if (errI) console.warn("Error loading connections as initiator:", errI);
  if (errT) console.warn("Error loading connections as target:", errT);

  const requests = [...(asInitiator || []), ...(asTarget || [])];
  const directConnectionIds = new Set();
  for (const row of requests) {
    const otherId = row.initiator_user_id === authUserId ? row.target_user_id : row.initiator_user_id;
    if (otherId && otherId !== authUserId) directConnectionIds.add(otherId);
  }

  // Phase B: Group chats the user belongs to (member_count > 2)
  const { data: myParticipations, error: errP } = await sb
    .from("group_chat_participants")
    .select("chat_guid")
    .eq("user_id", authUserId)
    .limit(100);
  if (errP) console.warn("Error loading participations:", errP);

  const myChatGuids = (myParticipations || []).map((p) => p.chat_guid);
  let multiGroups = [];
  if (myChatGuids.length > 0) {
    const { data: groups, error: errG } = await sb
      .from("group_chats")
      .select("chat_guid, member_count, display_name")
      .in("chat_guid", myChatGuids)
      .gt("member_count", 2)
      .limit(50);
    if (errG) console.warn("Error loading group chats:", errG);
    multiGroups = groups || [];
  }

  // Phase C: Fetch all participants for multi-person groups
  const allGroupMemberIds = new Set();
  const groupMembersMap = new Map(); // chat_guid → [user_id, ...]
  if (multiGroups.length > 0) {
    const groupGuids = multiGroups.map((g) => g.chat_guid);
    const { data: allParts, error: errAP } = await sb
      .from("group_chat_participants")
      .select("chat_guid, user_id")
      .in("chat_guid", groupGuids)
      .limit(500);
    if (errAP) console.warn("Error loading group participants:", errAP);
    for (const p of allParts || []) {
      if (!groupMembersMap.has(p.chat_guid)) groupMembersMap.set(p.chat_guid, []);
      groupMembersMap.get(p.chat_guid).push(p.user_id);
      if (p.user_id !== authUserId) allGroupMemberIds.add(p.user_id);
    }
  }

  // Phase D: Fetch all user profiles (direct connections + group members)
  const allUserIds = new Set([...directConnectionIds, ...allGroupMemberIds]);
  const ids = [...allUserIds].slice(0, 200);

  let connectionUsers = [];
  if (ids.length > 0) {
    const { data, error } = await sb
      .from(config.tables.users)
      .select("id, name, phone_number")
      .in("id", ids);
    if (error) console.warn("Error loading user names:", error);
    connectionUsers = data || [];
  }

  const nameMap = new Map();
  for (const user of connectionUsers) {
    nameMap.set(user.id, { name: user.name || formatPhoneDisplay(user.phone_number) || "Unknown", id: user.id });
  }

  // Build nodes
  const nodes = [
    { id: "me", type: "user", label: centerLabel, shortLabel: formatShortLabel(centerLabel), radius: 44 },
  ];
  const addedUserNodes = new Set(["me"]);

  for (const uid of directConnectionIds) {
    const info = nameMap.get(uid);
    const label = info?.name || "Unknown";
    nodes.push({ id: String(uid), type: "user", label, shortLabel: formatShortLabel(label), radius: 34 });
    addedUserNodes.add(String(uid));
  }

  for (const uid of allGroupMemberIds) {
    if (addedUserNodes.has(String(uid))) continue;
    const info = nameMap.get(uid);
    const label = info?.name || "Unknown";
    nodes.push({ id: String(uid), type: "user", label, shortLabel: formatShortLabel(label), radius: 34 });
    addedUserNodes.add(String(uid));
  }

  for (const group of multiGroups) {
    const memberIds = groupMembersMap.get(group.chat_guid) || [];
    const members = memberIds.map((uid) => nameMap.get(uid) || { id: uid, name: "Unknown" });
    const groupLabel = group.display_name || generateGroupName(members, authUserId);
    nodes.push({
      id: `group-${group.chat_guid}`,
      type: "group",
      label: groupLabel,
      shortLabel: formatShortLabel(groupLabel),
      radius: 28,
      memberCount: group.member_count,
    });
  }

  // Build links
  const links = [];
  for (const uid of directConnectionIds) {
    links.push({ source: "me", target: String(uid), type: "direct" });
  }
  for (const group of multiGroups) {
    const memberIds = groupMembersMap.get(group.chat_guid) || [];
    const groupNodeId = `group-${group.chat_guid}`;
    for (const uid of memberIds) {
      const nodeId = uid === authUserId ? "me" : String(uid);
      links.push({ source: nodeId, target: groupNodeId, type: "group" });
    }
  }

  return {
    nodes,
    links,
    stats: { directCount: directConnectionIds.size, groupCount: multiGroups.length },
  };
}

function renderGraph(nodes, links) {
  if (state.graph.destroy) state.graph.destroy();

  const svg = d3.select(el.graphSvg);
  svg.selectAll("*").remove();

  const wrap = el.graphContainer;
  const tooltipEl = el.graphTooltip;
  const tooltipTitle = document.getElementById("tooltipTitle");
  const tooltipSubtitle = document.getElementById("tooltipSubtitle");
  const width = wrap.clientWidth || 800;
  const height = wrap.clientHeight || 480;

  svg.attr("viewBox", `0 0 ${width} ${height}`);

  const centerNode = nodes.find((n) => n.id === "me");
  if (centerNode) {
    centerNode.fx = width / 2;
    centerNode.fy = height / 2;
  }

  // Defs
  const defs = svg.append("defs");

  const dropShadow = defs.append("filter")
    .attr("id", "nodeShadow")
    .attr("x", "-50%").attr("y", "-50%")
    .attr("width", "200%").attr("height", "200%");
  dropShadow.append("feDropShadow")
    .attr("dx", "0").attr("dy", "2")
    .attr("stdDeviation", "4")
    .attr("flood-color", "rgba(15, 23, 42, 0.1)");

  // Layers
  const linkLayer = svg.append("g");
  const nodeLayer = svg.append("g");

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id).distance((l) => l.type === "group" ? 100 : 160).strength(0.2))
    .force("charge", d3.forceManyBody().strength((d) => d.type === "group" ? -200 : -400))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collide", d3.forceCollide().radius((d) => d.radius + 30).strength(0.8))
    .alphaDecay(0.015)
    .alphaMin(0.001)
    .velocityDecay(0.35);

  // Safety: stop after 300 ticks
  let tickCount = 0;
  simulation.on("tick.safety", () => {
    tickCount++;
    if (tickCount > 300) simulation.stop();
  });

  // Links — differentiate direct vs group
  const link = linkLayer.selectAll("line")
    .data(links).enter().append("line")
    .attr("stroke", (l) => l.type === "group" ? "#5EEAD4" : "#E2E8F0")
    .attr("stroke-width", 1.5)
    .attr("stroke-linecap", "round")
    .attr("stroke-dasharray", (l) => l.type === "group" ? "6 4" : "none")
    .attr("opacity", 0.8);

  // Node groups
  const node = nodeLayer.selectAll("g")
    .data(nodes).enter().append("g")
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
        })
    );

  // User nodes — circles
  node.filter((d) => d.type === "user").each(function (d) {
    const g = d3.select(this);
    g.append("circle")
      .attr("r", d.radius)
      .attr("fill", d.id === "me" ? "#2563EB" : "#60A5FA")
      .attr("filter", "url(#nodeShadow)");
    g.append("circle")
      .attr("r", d.radius)
      .attr("fill", "none")
      .attr("stroke", d.id === "me" ? "rgba(37,99,235,0.3)" : "rgba(96,165,250,0.3)")
      .attr("stroke-width", 2);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", d.id === "me" ? 18 : 14)
      .attr("font-weight", 700)
      .attr("font-family", "Figtree, system-ui, sans-serif")
      .style("pointer-events", "none")
      .text(getInitials(d.label));
  });

  // Group nodes — rounded pill rectangles
  node.filter((d) => d.type === "group").each(function (d) {
    const g = d3.select(this);
    const pillW = 56;
    const pillH = 56;
    const pillR = 16;
    g.append("rect")
      .attr("x", -pillW / 2).attr("y", -pillH / 2)
      .attr("width", pillW).attr("height", pillH)
      .attr("rx", pillR)
      .attr("fill", "#0D9488")
      .attr("filter", "url(#nodeShadow)");
    g.append("rect")
      .attr("x", -pillW / 2).attr("y", -pillH / 2)
      .attr("width", pillW).attr("height", pillH)
      .attr("rx", pillR)
      .attr("fill", "none")
      .attr("stroke", "rgba(13,148,136,0.3)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4 3");
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("fill", "white")
      .attr("font-size", 16)
      .attr("font-weight", 700)
      .attr("font-family", "Figtree, system-ui, sans-serif")
      .style("pointer-events", "none")
      .text(d.memberCount || "?");
  });

  // Name badge below all nodes
  node.append("rect")
    .attr("x", (d) => -Math.max(d.shortLabel.length * 4, 20))
    .attr("y", (d) => d.radius + 6)
    .attr("width", (d) => Math.max(d.shortLabel.length * 8, 40))
    .attr("height", 20)
    .attr("rx", 10)
    .attr("fill", (d) => {
      if (d.type === "group") return "#0D9488";
      return d.id === "me" ? "#2563EB" : "#64748B";
    })
    .attr("opacity", 0.9);

  node.append("text")
    .attr("text-anchor", "middle")
    .attr("y", (d) => d.radius + 20)
    .attr("fill", "white")
    .attr("font-size", 11)
    .attr("font-weight", 600)
    .attr("font-family", "Figtree, system-ui, sans-serif")
    .style("pointer-events", "none")
    .text((d) => d.shortLabel);

  // Hover effects
  node
    .on("mouseenter", function (event, d) {
      d3.select(this).transition().duration(200).ease(d3.easeCubicOut)
        .attr("transform", `translate(${d.x},${d.y}) scale(1.08)`);

      link.transition().duration(200)
        .attr("opacity", (l) => (l.source.id === d.id || l.target.id === d.id) ? 1 : 0.15)
        .attr("stroke-width", (l) => (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1.5);

      node.transition().duration(200).attr("opacity", (n) => {
        if (n.id === d.id) return 1;
        const connected = links.some(
          (l) => (l.source.id === d.id && l.target.id === n.id) || (l.target.id === d.id && l.source.id === n.id)
        );
        return connected ? 1 : 0.35;
      });

      showTooltip(event, d);
    })
    .on("mouseleave", function (_event, d) {
      d3.select(this).transition().duration(250).attr("transform", `translate(${d.x},${d.y}) scale(1)`);
      link.transition().duration(250)
        .attr("opacity", 0.8)
        .attr("stroke-width", 1.5);
      node.transition().duration(250).attr("opacity", 1);
      hideTooltip();
    });

  function showTooltip(event, d) {
    if (tooltipTitle) {
      tooltipTitle.textContent = d.label;
      tooltipSubtitle.textContent = d.type === "group" ? `${d.memberCount} members` : "";
      tooltipSubtitle.style.display = d.type === "group" ? "block" : "none";
    } else {
      tooltipEl.textContent = d.label;
    }
    const rect = wrap.getBoundingClientRect();
    tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
    tooltipEl.style.top = `${event.clientY - rect.top - 10}px`;
    tooltipEl.classList.add("visible");
  }

  function hideTooltip() {
    tooltipEl.classList.remove("visible");
  }

  svg.on("mousemove", (event) => {
    if (tooltipEl.classList.contains("visible")) {
      const rect = wrap.getBoundingClientRect();
      tooltipEl.style.left = `${event.clientX - rect.left + 15}px`;
      tooltipEl.style.top = `${event.clientY - rect.top - 10}px`;
    }
  });

  // Tick
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("transform", (d) => `translate(${d.x},${d.y})`);
  });

  // Resize
  const onResize = () => {
    const w = wrap.clientWidth || width;
    const h = wrap.clientHeight || height;
    svg.attr("viewBox", `0 0 ${w} ${h}`);
    if (centerNode) {
      centerNode.fx = w / 2;
      centerNode.fy = h / 2;
    }
    simulation.force("center", d3.forceCenter(w / 2, h / 2));
    simulation.alpha(0.3).restart();
  };

  window.addEventListener("resize", onResize);
  state.graph.destroy = () => {
    window.removeEventListener("resize", onResize);
    simulation.stop();
  };
}

async function ensureGraph() {
  setStatus(el.graphStatus, "Loading connections...");
  el.graphContainer.classList.remove("hidden");
  el.graphEmptyState.classList.add("hidden");

  try {
    const { nodes, links, stats } = await loadGraphData();

    if (stats.directCount === 0 && stats.groupCount === 0) {
      el.graphContainer.classList.add("hidden");
      el.graphEmptyState.classList.remove("hidden");
      el.connectionCount.innerHTML = "";
      setStatus(el.graphStatus, "");
      return;
    }

    // Build connection count display
    const parts = [];
    if (stats.directCount > 0) {
      parts.push(`<span class="connection-count-pill">${stats.directCount} connection${stats.directCount !== 1 ? "s" : ""}</span>`);
    }
    if (stats.groupCount > 0) {
      parts.push(`<span class="connection-count-group">${stats.groupCount} group${stats.groupCount !== 1 ? "s" : ""}</span>`);
    }
    el.connectionCount.innerHTML = parts.join(" ");

    renderGraph(nodes, links);
    setStatus(el.graphStatus, "");
  } catch (err) {
    console.error("Graph error:", err);
    setStatus(el.graphStatus, err?.message || "Failed to load connections.", "error");
    el.graphContainer.classList.add("hidden");
    el.graphEmptyState.classList.remove("hidden");
  }
}

// ==================== APP ENTRY ====================

async function enterApp() {
  showView("app");

  try {
    const profile = await loadProfile();

    if (!profile) {
      // Signed in but not onboarded — sign out and show error
      await sb.auth.signOut();
      showView("login");
      setStatus(
        el.loginStatus,
        'This account hasn\'t been set up yet. Text Frank to get started!',
        "error"
      );
      return;
    }

    renderProfile(profile);
    setTab("profile");
  } catch (err) {
    console.error("enterApp error:", err);
    setStatus(el.loginStatus, err?.message || "Something went wrong.", "error");
    showView("login");
  }
}

async function handleRoute() {
  const { data } = await sb.auth.getSession();
  if (data.session) {
    await enterApp();
  } else {
    showView("login");
  }
}

// ==================== EVENT LISTENERS ====================

el.loginForm.addEventListener("submit", handleLogin);
el.logoutButton.addEventListener("click", handleLogout);

// Tabs
el.tabProfile.addEventListener("click", () => setTab("profile"));
el.tabConnections.addEventListener("click", async () => {
  setTab("connections");
  await ensureGraph();
});

// Avatar
el.avatarWrapper.addEventListener("click", openFilePicker);
el.avatarWrapper.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openFilePicker(); }
});
el.changePhotoLink.addEventListener("click", openFilePicker);
el.avatarFileInput.addEventListener("change", handleFileSelected);
el.avatarSaveBtn.addEventListener("click", saveAvatar);
el.avatarCancelBtn.addEventListener("click", cancelAvatarUpload);

// Password
el.changePasswordToggle.addEventListener("click", togglePasswordForm);
el.cancelPasswordBtn.addEventListener("click", hidePasswordForm);
el.updatePasswordBtn.addEventListener("click", handleUpdatePassword);

// Auth state changes
sb.auth.onAuthStateChange(async (_event, session) => {
  if (!session) showView("login");
});

// Init
handleRoute().catch((err) => {
  console.error("Init error:", err);
  showView("login");
});
