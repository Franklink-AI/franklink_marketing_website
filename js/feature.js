document.addEventListener('DOMContentLoaded', () => {
    // Only run this script on the feature page
    if (!document.body.classList.contains('page-feature')) return;

    // --- Hero Background Video + Overlay ---
    const heroSection = document.getElementById('hero');
    const heroVideo = document.getElementById('hero-background-video');
    const nextSection = document.getElementById('feature-scroll-container');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    function setupHeroVideoSequence() {
        if (!heroVideo) return;

        const sources = [
            '/assets/videos/handshaking-1.mp4',
            '/assets/videos/handshaking-2.mp4'
        ];
        let currentIndex = 0;
        let isSwitching = false;

        const tryPlay = () => {
            const playPromise = heroVideo.play();
            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(() => {});
            }
        };

        const switchVideo = () => {
            if (isSwitching) return;
            isSwitching = true;
            currentIndex = (currentIndex + 1) % sources.length;
            heroVideo.src = sources[currentIndex];
            heroVideo.load();
            tryPlay();
        };

        const maybeSwitchVideo = () => {
            if (isSwitching || !heroVideo.duration) return;
            if (heroVideo.duration - heroVideo.currentTime <= 0.35) {
                switchVideo();
            }
        };

        heroVideo.muted = true;
        heroVideo.playsInline = true;
        if (!heroVideo.src) {
            heroVideo.src = sources[0];
        }
        heroVideo.load();
        tryPlay();

        heroVideo.addEventListener('timeupdate', maybeSwitchVideo);
        heroVideo.addEventListener('ended', switchVideo);
        heroVideo.addEventListener('loadeddata', () => {
            isSwitching = false;
        });
    }

    setupHeroVideoSequence();

    // --- Configuration ---
    const TYPING_SPEED_MIN = 30;
    const TYPING_SPEED_MAX = 80;
    const MESSAGE_PAUSE = 1000; // Pause before sending
    const REPLY_PAUSE = 1500;   // Pause before bot replies
    const DEMO_GAP = 1500;      // Pause between demo 1 and demo 2
    const CYCLE_PAUSE = 2000;   // Pause before clearing and restarting

    // --- Data: Scenarios ---
    // Structure: 4 Sections -> Each has 2 Demos -> Each has a conversation array
    // Frank does warm intros explaining WHY he's connecting people
    const SCENARIOS = [
        // Section 0: The first groupchat that becomes your startup
        [
            // Demo 1: Frank makes the intro
            [
                { type: 'bot', text: "Frank: I'm putting you three together because I think you could build something special.\n\n@Jordan just told me about an idea for AI-powered cofounder matching. @Alex, you've been looking for a technical cofounder for months. And @Sam, you literally built a matching algorithm at your last job.\n\nJordan has the vision. Sam has the tech. Alex has the product eye. This could work." },
                { type: 'user', text: "Jordan: Wait, you're the Alex who designed that fintech app? I loved that onboarding flow." },
                { type: 'bot', text: "Alex: And Sam, your matching algo post on Twitter was genius. I saved it." },
                { type: 'user', text: "Sam: Okay this is wild. I've been wanting to build something in this space. What if we actually did this?" }
            ],
            // Demo 2: The result
            [
                { type: 'bot', text: "Jordan: MVP is live. 47 signups in 2 hours." },
                { type: 'user', text: "Alex: Frank really knew what he was doing putting us together." },
                { type: 'bot', text: "Sam: Best groupchat I've ever been added to." }
            ]
        ],
        // Section 1: The first groupchat where interview questions actually get shared
        [
            // Demo 1: Frank connects candidates
            [
                { type: 'bot', text: "Frank: Connecting you two because timing is perfect.\n\n@Maya just finished her Stripe PM loop yesterday. @Chris, you have the same interview next week.\n\nMaya's been where you're about to be, Chris. And Maya, Chris has Google questions from last month if you're still interviewing there." },
                { type: 'user', text: "Maya: Happy to share everything! Round 1 was product sense on cross-border payments. Round 2 was a metrics deep dive." },
                { type: 'bot', text: "Chris: This is exactly what I needed. I'll send you the full Google breakdown right now." },
                { type: 'user', text: "Maya: Deal. We got each other." }
            ],
            // Demo 2: Paying it forward
            [
                { type: 'bot', text: "Chris: I GOT THE OFFER. Your tips on the metrics round saved me." },
                { type: 'user', text: "Maya: Let's go!! Your Google questions helped me too. Just got to final round." },
                { type: 'bot', text: "Chris: This is how it should work. No gatekeeping." }
            ]
        ],
        // Section 2: The first groupchat with the people grinding finals with you at 2 a.m
        [
            // Demo 1: Frank creates a study crew
            [
                { type: 'bot', text: "Frank: You three are all in Orgo 232 and all struggling with the same reaction mechanisms.\n\n@Jake, you mentioned nucleophilic substitution is killing you. @Priya, same thing. And @Marcus, you just figured out the SN1 vs SN2 distinction that's tripping everyone up.\n\nThought you could help each other survive this final." },
                { type: 'user', text: "Jake: Wait Marcus you cracked it?? I've been stuck on problem 7 for hours." },
                { type: 'bot', text: "Marcus: Yes! The solvent is the key. Polar protic = SN1, polar aprotic = SN2." },
                { type: 'user', text: "Priya: THAT'S what I was missing. You're a lifesaver." }
            ],
            // Demo 2: Success together
            [
                { type: 'bot', text: "Jake: WE ALL PASSED. Group study saved my GPA." },
                { type: 'user', text: "Priya: Frank putting us together was clutch." },
                { type: 'bot', text: "Marcus: Same crew next semester?" }
            ]
        ],
        // Section 3: The first groupchat with strangers who turn into your AI conference crew
        [
            // Demo 1: Pre-conference matching
            [
                { type: 'bot', text: "Frank: You're all attending NeurIPS next week and working on multimodal AI. Thought you should meet before the conference starts.\n\n@Riley is doing PhD research on vision-language models at Stanford. @Jordan is an ML engineer at Anthropic working on similar problems. And @Casey is building a stealth startup in this space.\n\nDifferent angles, same obsession. Could be a good crew." },
                { type: 'user', text: "Riley: This is great! Down to grab coffee before the keynote tomorrow?" },
                { type: 'bot', text: "Jordan: I'm in. The poster session on diffusion models after looks good too." },
                { type: 'user', text: "Casey: Count me in. Always better to walk into a conference with people to find." }
            ],
            // Demo 2: Conference crew formed
            [
                { type: 'bot', text: "Casey: That hallway convo about attention mechanisms was better than most talks." },
                { type: 'user', text: "Riley: Agreed. Same crew for ICML?" },
                { type: 'bot', text: "Jordan: Already in my calendar. Strangers to conference crew in 48 hours." }
            ]
        ]
    ];

    // --- DOM Elements ---
    const chatArea = document.getElementById('chat-area');
    const inputField = document.getElementById('phone-input');
    const sections = document.querySelectorAll('.feature-section');

    // --- State ---
    let currentSectionIndex = 0;
    let isAnimating = false;
    let animationController = new AbortController(); // To cancel ongoing animations

    // --- Helpers ---
    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const resizeInputField = () => {
        if (!inputField) return;
        inputField.style.height = 'auto';
        inputField.style.height = `${inputField.scrollHeight}px`;
    };

    // --- Animation Logic ---

    // 1. Type text into input field
    async function typeText(text, signal) {
        inputField.value = "";
        resizeInputField();
        for (let i = 0; i < text.length; i++) {
            if (signal.aborted) return;
            inputField.value += text[i];
            resizeInputField();
            await wait(random(TYPING_SPEED_MIN, TYPING_SPEED_MAX));
        }
    }

    // 2. Add message bubble to chat
    function addMessage(text, type) {
        const bubble = document.createElement('div');
        bubble.classList.add('message-bubble', type);
        // Handle newlines for bot messages
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        chatArea.appendChild(bubble);
        // Scroll to bottom
        chatArea.scrollTop = chatArea.scrollHeight;
    }

    // 3. Run a single conversation demo
    async function runDemo(conversation, signal) {
        for (const msg of conversation) {
            if (signal.aborted) return;

            if (msg.type === 'user') {
                // User message appears instantly (no typing animation)
                await wait(REPLY_PAUSE);
                if (signal.aborted) return;
                addMessage(msg.text, 'user');
            } else {
                // Bot replies...
                // Simulate "thinking" time
                await wait(REPLY_PAUSE);
                if (signal.aborted) return;

                addMessage(msg.text, 'bot');
            }
        }
    }

    // 4. Main Loop for a Section
    async function startSectionLoop(sectionIndex) {
        // Cancel previous loop
        animationController.abort();
        animationController = new AbortController();
        const signal = animationController.signal;

        isAnimating = true;
        const demos = SCENARIOS[sectionIndex];

        try {
            while (!signal.aborted) {
                for (let i = 0; i < demos.length; i++) {
                    if (signal.aborted) break;

                    if (i === 0) {
                        chatArea.innerHTML = '';
                        inputField.value = '';
                        resizeInputField();
                    }

                    await runDemo(demos[i], signal);

                    if (signal.aborted) break;

                    if (i < demos.length - 1) {
                        await wait(DEMO_GAP);
                        if (signal.aborted) break;
                        chatArea.innerHTML = '';
                        inputField.value = '';
                        resizeInputField();
                    } else {
                        await wait(CYCLE_PAUSE);
                    }
                }
            }
        } catch (err) {
            // Ignore abort errors
        }
    }

    // --- Scroll Observer ---
    const observerOptions = {
        root: null,
        threshold: 0.5 // Trigger when 50% of section is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.getAttribute('data-index'));

                // Update active class for text animation
                sections.forEach(s => s.classList.remove('active'));
                entry.target.classList.add('active');

                // Only restart animation if section changed
                if (index !== currentSectionIndex) {
                    currentSectionIndex = index;
                    startSectionLoop(currentSectionIndex);
                }
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Start initial loop
    // Ensure we start with the first section active if it's visible,
    // but the observer will likely catch it.
    // However, to be safe on load:
    if (sections.length > 0) {
        sections[0].classList.add('active');
        startSectionLoop(0);
    }
});

/**
 * Context Web Visualization - Scroll-Based Animation Controller
 */
(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        PARTICLE_COUNT: 15,
        PARTICLE_DURATION_MIN: 1200,
        PARTICLE_DURATION_MAX: 2000,
        SCROLL_PHASES: {
            SOURCES_START: 0,
            SOURCES_END: 0.35,
            PROCESSING_START: 0.35,
            PROCESSING_END: 0.65,
            CONNECTIONS_START: 0.65,
            CONNECTIONS_END: 1.0
        }
    };

    // State
    let section = null;
    let isInView = false;
    let scrollProgress = 0;
    let animationFrameId = null;
    let particlePool = [];
    let prefersReducedMotion = false;
    let revealedProfileIndices = new Set();

    // Rolling profile state
    let currentProfileIndex = 0;
    let profileRotationInterval = null;
    const PROFILE_ROTATION_DELAY = 2000; // 2 seconds per profile

    // DOM Elements Cache
    let elements = {
        header: null,
        sourceNodes: [],
        frankNode: null,
        frankContainer: null,
        rollingProfiles: [],
        particleContainer: null,
        progressFill: null
    };

    /**
     * Initialize the Context Web visualization
     */
    function init() {
        section = document.querySelector('.context-web-section');
        if (!section) return;

        // Check reduced motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        prefersReducedMotion = motionQuery.matches;
        motionQuery.addEventListener('change', (e) => {
            prefersReducedMotion = e.matches;
        });

        // Cache DOM elements
        cacheElements();

        // Set up Intersection Observer for section visibility
        setupIntersectionObserver();

        // Set up scroll listener for animation progression
        setupScrollListener();

        // Initialize particle pool
        if (!prefersReducedMotion) {
            initParticlePool();
        }
    }

    /**
     * Cache frequently accessed DOM elements
     */
    function cacheElements() {
        elements.header = section.querySelector('.context-web-header');
        elements.sourceNodes = Array.from(section.querySelectorAll('.source-node'));
        elements.frankNode = section.querySelector('.frank-node');
        elements.frankContainer = section.querySelector('.frank-node-container');
        elements.rollingProfiles = Array.from(section.querySelectorAll('.rolling-profile'));
        elements.particleContainer = section.querySelector('.particle-container');
        elements.progressFill = section.querySelector('.progress-fill');
    }

    /**
     * Set up Intersection Observer for section visibility
     */
    function setupIntersectionObserver() {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    isInView = entry.isIntersecting;

                    if (isInView) {
                        section.classList.add('in-view');
                        updateScrollProgress();
                        startAnimationLoop();
                        // Start profile rotation when section is in view
                        startProfileRotation();
                    } else {
                        section.classList.remove('in-view', 'processing');
                        stopAnimationLoop();
                        resetAnimation();
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '-5% 0px'
            }
        );

        observer.observe(section);
    }

    /**
     * Set up scroll listener for animation progression
     */
    function setupScrollListener() {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking && isInView) {
                requestAnimationFrame(() => {
                    updateScrollProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /**
     * Calculate scroll progress within the section (0 to 1)
     */
    function updateScrollProgress() {
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        // Progress based on how far through the section we've scrolled
        const sectionTop = rect.top;
        const sectionHeight = rect.height;

        // Start progress when section enters (top at bottom of viewport)
        // End progress when section exits (bottom at top of viewport)
        const scrollStart = viewportHeight * 0.8;
        const scrollEnd = -sectionHeight * 0.3;
        const totalDistance = scrollStart - scrollEnd;

        scrollProgress = Math.max(0, Math.min(1,
            (scrollStart - sectionTop) / totalDistance
        ));

        // Update animations based on scroll progress
        updateAnimationPhases();
    }

    /**
     * Update animation phases based on scroll progress
     */
    function updateAnimationPhases() {
        const { SCROLL_PHASES } = CONFIG;

        // Update progress bar
        if (elements.progressFill) {
            elements.progressFill.style.width = `${scrollProgress * 100}%`;
        }

        // Phase 1: Source nodes activation (0% - 35%)
        if (scrollProgress >= SCROLL_PHASES.SOURCES_START &&
            scrollProgress < SCROLL_PHASES.SOURCES_END) {

            const phaseProgress = (scrollProgress - SCROLL_PHASES.SOURCES_START) /
                                  (SCROLL_PHASES.SOURCES_END - SCROLL_PHASES.SOURCES_START);
            activateSourceNodes(phaseProgress);
            section.classList.remove('processing');
            deactivateProfileNodes();
        }

        // Phase 2: Frank processing (35% - 65%)
        else if (scrollProgress >= SCROLL_PHASES.PROCESSING_START &&
                 scrollProgress < SCROLL_PHASES.PROCESSING_END) {

            activateAllSources();
            section.classList.add('processing');
            deactivateProfileNodes();
        }

        // Phase 3: Connection output (65% - 100%)
        else if (scrollProgress >= SCROLL_PHASES.CONNECTIONS_START) {
            activateAllSources();
            section.classList.add('processing');
            activateAllProfiles();
        }

        // Before animation starts
        else {
            deactivateAllNodes();
            section.classList.remove('processing');
        }
    }

    /**
     * Activate source nodes progressively
     */
    function activateSourceNodes(progress) {
        const totalNodes = elements.sourceNodes.length;
        const activeCount = Math.ceil(progress * totalNodes);

        elements.sourceNodes.forEach((node, index) => {
            // Stagger visibility
            const visibilityThreshold = index / totalNodes;
            if (progress >= visibilityThreshold * 0.8) {
                node.classList.add('visible');
            }

            if (index < activeCount) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
    }

    /**
     * Activate all source nodes
     */
    function activateAllSources() {
        elements.sourceNodes.forEach((node) => {
            node.classList.add('visible', 'active');
        });
    }

    /**
     * Activate rolling profile display (no-op, rotation is time-based)
     */
    function activateAllProfiles() {
        // Rotation is now time-based, started when section comes into view
    }

    /**
     * Deactivate rolling profile display (no-op, rotation continues while in view)
     */
    function deactivateProfileNodes() {
        // Rotation continues while section is in view
    }

    /**
     * Start automatic profile rotation
     */
    function startProfileRotation() {
        if (profileRotationInterval) return;
        profileRotationInterval = setInterval(rotateToNextProfile, PROFILE_ROTATION_DELAY);
    }

    /**
     * Stop profile rotation
     */
    function stopProfileRotation() {
        if (profileRotationInterval) {
            clearInterval(profileRotationInterval);
            profileRotationInterval = null;
        }
    }

    /**
     * Rotate to the next profile in the rolling display
     */
    function rotateToNextProfile() {
        const profiles = elements.rollingProfiles;
        if (!profiles || profiles.length === 0) return;

        // Exit current profile
        profiles[currentProfileIndex].classList.add('exiting');
        profiles[currentProfileIndex].classList.remove('active');

        // Move to next
        currentProfileIndex = (currentProfileIndex + 1) % profiles.length;

        // Enter new profile after brief delay
        setTimeout(() => {
            profiles.forEach(p => p.classList.remove('exiting'));
            profiles[currentProfileIndex].classList.add('active');
        }, 300);
    }

    /**
     * Reset profile rotation to initial state
     */
    function resetProfileRotation() {
        stopProfileRotation();
        currentProfileIndex = 0;
        if (elements.rollingProfiles) {
            elements.rollingProfiles.forEach((p, i) => {
                p.classList.remove('active', 'exiting');
                if (i === 0) p.classList.add('active');
            });
        }
    }

    /**
     * Deactivate all nodes
     */
    function deactivateAllNodes() {
        elements.sourceNodes.forEach((node) => {
            node.classList.remove('active');
        });
        stopProfileRotation();
    }

    /**
     * Reset animation to initial state
     */
    function resetAnimation() {
        elements.sourceNodes.forEach((node) => {
            node.classList.remove('visible', 'active');
        });

        // Reset rolling profiles
        resetProfileRotation();

        if (elements.progressFill) {
            elements.progressFill.style.width = '0%';
        }

        // Clear particles
        if (elements.particleContainer) {
            elements.particleContainer.innerHTML = '';
        }

        scrollProgress = 0;
    }

    /**
     * Initialize particle pool for performance
     */
    function initParticlePool() {
        particlePool = [];
        for (let i = 0; i < CONFIG.PARTICLE_COUNT; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particlePool.push(particle);
        }
    }

    /**
     * Get a particle from the pool
     */
    function getParticle() {
        const particle = particlePool.find(p => !p.parentElement);
        if (particle) return particle;

        // Create new particle if pool exhausted
        const newParticle = document.createElement('div');
        newParticle.className = 'particle';
        particlePool.push(newParticle);
        return newParticle;
    }

    /**
     * Spawn a particle flowing from source node to Frank
     */
    function spawnParticleFromSource(sourceNode) {
        if (prefersReducedMotion || !elements.particleContainer || !elements.frankNode) return;

        const particle = getParticle();

        // Get positions
        const sourceRect = sourceNode.getBoundingClientRect();
        const containerRect = elements.particleContainer.getBoundingClientRect();
        const frankRect = elements.frankNode.getBoundingClientRect();

        // Calculate start and end positions relative to container
        const startX = sourceRect.right - containerRect.left;
        const baseStartY = sourceRect.top + sourceRect.height / 2 - containerRect.top;
        const endX = frankRect.left + frankRect.width / 2 - containerRect.left;
        const endY = frankRect.top + frankRect.height / 2 - containerRect.top;

        // Add vertical jitter to start position for organic feel
        const startJitter = (Math.random() - 0.5) * 12;
        const startY = baseStartY + startJitter;

        // Add curve offset for organic curved paths
        const curveOffset = (Math.random() - 0.5) * 35;
        const curveY = (Math.random() - 0.5) * 20;

        // Set CSS custom properties for animation
        particle.style.setProperty('--start-x', `${startX}px`);
        particle.style.setProperty('--start-y', `${startY}px`);
        particle.style.setProperty('--end-x', `${endX}px`);
        particle.style.setProperty('--end-y', `${endY}px`);
        particle.style.setProperty('--curve-offset', `${curveOffset}px`);
        particle.style.setProperty('--curve-y', `${curveY}px`);

        // Add size variation for visual interest
        particle.classList.remove('particle--sm', 'particle--lg');
        const sizeRoll = Math.random();
        if (sizeRoll < 0.25) {
            particle.classList.add('particle--sm');
        } else if (sizeRoll > 0.85) {
            particle.classList.add('particle--lg');
        }

        const duration = Math.random() *
            (CONFIG.PARTICLE_DURATION_MAX - CONFIG.PARTICLE_DURATION_MIN) +
            CONFIG.PARTICLE_DURATION_MIN;
        particle.style.setProperty('--flow-duration', `${duration}ms`);

        // Add to container and start animation
        elements.particleContainer.appendChild(particle);
        particle.classList.add('flowing');

        // Remove after animation
        setTimeout(() => {
            particle.classList.remove('flowing', 'particle--sm', 'particle--lg');
            if (particle.parentElement) {
                particle.parentElement.removeChild(particle);
            }
        }, duration + 100);
    }

    /**
     * Spawn a particle flowing from Frank to profile node
     */
    function spawnParticleToProfile(profileNode) {
        if (prefersReducedMotion || !elements.particleContainer || !elements.frankNode) return;

        const particle = getParticle();

        // Get positions
        const profileRect = profileNode.getBoundingClientRect();
        const containerRect = elements.particleContainer.getBoundingClientRect();
        const frankRect = elements.frankNode.getBoundingClientRect();

        // Calculate start (Frank) and end (profile) positions
        const startX = frankRect.left + frankRect.width / 2 - containerRect.left;
        const startY = frankRect.top + frankRect.height / 2 - containerRect.top;
        const endX = profileRect.left - containerRect.left;
        const endY = profileRect.top + profileRect.height / 2 - containerRect.top;

        // Set CSS custom properties for animation
        particle.style.setProperty('--start-x', `${startX}px`);
        particle.style.setProperty('--start-y', `${startY}px`);
        particle.style.setProperty('--end-x', `${endX}px`);
        particle.style.setProperty('--end-y', `${endY}px`);

        // Different color for outbound particles
        particle.style.background = '#10B981';
        particle.style.boxShadow = '0 0 8px #10B981, 0 0 16px #059669';

        const duration = Math.random() *
            (CONFIG.PARTICLE_DURATION_MAX - CONFIG.PARTICLE_DURATION_MIN) +
            CONFIG.PARTICLE_DURATION_MIN;
        particle.style.setProperty('--flow-duration', `${duration}ms`);

        // Add to container and start animation
        elements.particleContainer.appendChild(particle);
        particle.classList.add('flowing');

        // Remove after animation and reset color
        setTimeout(() => {
            particle.classList.remove('flowing');
            particle.style.background = '';
            particle.style.boxShadow = '';
            if (particle.parentElement) {
                particle.parentElement.removeChild(particle);
            }
        }, duration + 100);
    }

    /**
     * Start the animation loop
     */
    function startAnimationLoop() {
        if (animationFrameId) return;

        const loop = () => {
            if (isInView && !prefersReducedMotion) {
                // Spawn particles from active sources
                // Slightly higher rate (5%) for subtle but visible ion flow
                elements.sourceNodes.forEach((node) => {
                    if (node.classList.contains('active') && Math.random() < 0.05) {
                        spawnParticleFromSource(node);
                    }
                });

                // Spawn particles to active profiles (during connection phase)
                if (section.classList.contains('processing')) {
                    elements.profileNodes.forEach((node) => {
                        if (node.classList.contains('active') && Math.random() < 0.025) {
                            spawnParticleToProfile(node);
                        }
                    });
                }
            }
            animationFrameId = requestAnimationFrame(loop);
        };

        animationFrameId = requestAnimationFrame(loop);
    }

    /**
     * Stop the animation loop
     */
    function stopAnimationLoop() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
