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
    // Structure: 5 Sections -> Each has 2 Demos -> Each has a conversation array
    const SCENARIOS = [
        // Section 0: The first groupchat that becomes your startup
        [
            // Demo 1: Late night idea sparks
            [
                { type: 'user', text: "Jordan: I can't sleep. What if we built an AI that matches cofounders by vibe, not just skills?" },
                { type: 'bot', text: "Alex: Wait, that's actually good. I've been thinking about the same problem." },
                { type: 'user', text: "Sam: I can build the matching algo. Who's doing product?" },
                { type: 'bot', text: "Jordan: I'll take product. Alex, you in for design?" },
                { type: 'user', text: "Alex: Let's do it. Pitch deck by Friday?" }
            ],
            // Demo 2: Making progress
            [
                { type: 'bot', text: "Sam: MVP is live. 47 signups in 2 hours." },
                { type: 'user', text: "Jordan: This groupchat really became a startup huh" },
                { type: 'bot', text: "Alex: Told you 3am ideas hit different" }
            ]
        ],
        // Section 1: The first groupchat where interview questions actually get shared
        [
            // Demo 1: Sharing interview intel
            [
                { type: 'user', text: "Maya: Just finished my Stripe PM interview. Happy to share questions if anyone needs them." },
                { type: 'bot', text: "Chris: Yes please! I have mine next week." },
                { type: 'user', text: "Maya: Round 1 was a product sense case on cross-border payments. Round 2 was metrics deep dive." },
                { type: 'bot', text: "Chris: This is so helpful. I'll share my Google questions after tomorrow." }
            ],
            // Demo 2: Paying it forward
            [
                { type: 'bot', text: "Chris: Got the offer! Sharing the full Google loop breakdown now." },
                { type: 'user', text: "Taylor: This group is unreal. No gatekeeping, just people helping people." },
                { type: 'bot', text: "Maya: That's the whole point. We all win together." }
            ]
        ],
        // Section 2: The first groupchat with the people grinding finals with you at 2 a.m
        [
            // Demo 1: Late night study session
            [
                { type: 'user', text: "Jake: Anyone still awake? This orgo problem set is destroying me." },
                { type: 'bot', text: "Priya: Same. I'm on problem 7. The mechanism makes no sense." },
                { type: 'user', text: "Marcus: I just cracked it. It's an SN2, not SN1. The solvent is the clue." },
                { type: 'bot', text: "Priya: WAIT that actually makes sense now. You're a lifesaver." }
            ],
            // Demo 2: Surviving together
            [
                { type: 'bot', text: "Jake: We all passed!!! Group study sessions saved my GPA." },
                { type: 'user', text: "Marcus: Couldn't have done it without you all. Same time next semester?" },
                { type: 'bot', text: "Priya: Obviously. This is our crew now." }
            ]
        ],
        // Section 3: The first groupchat with strangers who turn into your AI conference crew
        [
            // Demo 1: Pre-conference matching
            [
                { type: 'bot', text: "Frank: Found 3 attendees at NeurIPS who share your interests in multimodal AI:\n\n• Riley - PhD at Stanford\n• Jordan - ML Engineer at Anthropic\n• Casey - Founder, stealth startup" },
                { type: 'user', text: "Amazing, let's make a group!" },
                { type: 'bot', text: "Riley: Hey! Down to grab coffee before the keynote tomorrow?" },
                { type: 'user', text: "Jordan: I'm in. The poster session after looks good too." }
            ],
            // Demo 2: Conference crew formed
            [
                { type: 'bot', text: "Casey: That hallway convo about diffusion models was better than most talks." },
                { type: 'user', text: "Riley: Agreed. Same crew for ICML?" },
                { type: 'bot', text: "Jordan: Already in my calendar. Strangers to conference crew in 48 hours." }
            ]
        ],
        // Section 4: Career Answers and Support
        [
            // Demo 9: M&A Technical Question
            [
                { type: 'user', text: "In an all-stock acquisition, how do I show accretion/dilution when the target has negative net income? What actually drives the result?" },
                { type: 'bot', text: "Frank: Accretion/dilution is driven by relative P/E, net synergies, and one-time costs. Build pro forma EPS with the exchange ratio, adjust target earnings for purchase accounting, subtract integration costs, then layer synergies with a ramp and sensitize." }
            ],
            // Demo 10: Emotional Support
            [
                { type: 'user', text: "I'm behind. Everyone else is moving faster and I feel like I'm not built for this." },
                { type: 'bot', text: "Frank: That feeling is real, and you're not alone. Rest tonight - I'll draft a minimal action plan for tomorrow." }
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
