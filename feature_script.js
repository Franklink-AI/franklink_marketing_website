document.addEventListener('DOMContentLoaded', () => {
    // Only run this script on the feature page
    if (!document.body.classList.contains('page-feature')) return;

    // --- Hero Background Video + Overlay ---
    const heroSection = document.getElementById('hero');
    const heroVideo = document.getElementById('hero-background-video');
    const nextSection = document.getElementById('feature-scroll-container');
    const navBar = document.querySelector('.navbar');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = reducedMotionQuery.matches;

    const OVERLAY_MAX = 0.82;
    const OVERLAY_MIN = 0.2;
    const NAV_INTERACTIVE_THRESHOLD = 0.85;

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

    function setupHeroOverlayScroll() {
        if (!heroSection || !nextSection) return;

        let heroStart = 0;
        let heroEnd = 0;
        let rafId = null;

        const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

        const setOverlayOpacity = (value) => {
            heroSection.style.setProperty('--hero-overlay-opacity', value.toFixed(3));
        };

        const setNavReveal = (value) => {
            if (!navBar) return;
            navBar.style.setProperty('--nav-reveal', value.toFixed(3));
            navBar.classList.toggle('nav-interactive', value >= NAV_INTERACTIVE_THRESHOLD);
        };

        const recalcBounds = () => {
            heroStart = heroSection.offsetTop;
            const nextTop = nextSection.offsetTop;
            const minEnd = heroStart + heroSection.offsetHeight;
            heroEnd = Math.max(nextTop, minEnd);
        };

        const updateOverlay = () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const progress = clamp((scrollY - heroStart) / (heroEnd - heroStart), 0, 1);

            if (prefersReducedMotion) {
                setOverlayOpacity(OVERLAY_MAX);
                setNavReveal(progress >= 1 ? 1 : 0);
                return;
            }
            const opacity = OVERLAY_MAX - (OVERLAY_MAX - OVERLAY_MIN) * progress;
            setOverlayOpacity(opacity);
            setNavReveal(progress);
        };

        const onScroll = () => {
            if (prefersReducedMotion) return;
            if (rafId) return;
            rafId = window.requestAnimationFrame(() => {
                rafId = null;
                updateOverlay();
            });
        };

        if (navBar) {
            navBar.classList.add('nav-reveal-active');
        }

        recalcBounds();
        updateOverlay();

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', () => {
            recalcBounds();
            updateOverlay();
        });

        const handleReducedMotionChange = (event) => {
            prefersReducedMotion = event.matches;
            updateOverlay();
        };

        if (typeof reducedMotionQuery.addEventListener === 'function') {
            reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
        } else if (typeof reducedMotionQuery.addListener === 'function') {
            reducedMotionQuery.addListener(handleReducedMotionChange);
        }
    }

    setupHeroVideoSequence();
    setupHeroOverlayScroll();

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
        // Section 0: Profile-First Onboarding
        [
            // Demo 1: Onboarding
            [
                { type: 'bot', text: "Frank: Welcome! What's your name?" },
                { type: 'user', text: "I'm Jordan Lee." },
                { type: 'bot', text: "Frank: Nice to meet you, Jordan. Drop your LinkedIn link so I can map your background." },
                { type: 'user', text: "linkedin.com/in/jordanlee" },
                { type: 'bot', text: "Frank: Great. Which career directions are you most interested in right now?" },
                { type: 'user', text: "AI product management and growth strategy." },
                { type: 'bot', text: "Frank: Summary - Jordan Lee, AI PM + growth strategy. I'll focus your target circle on aligned alumni and peers." }
            ],
            // Demo 2: Profile Update
            [
                { type: 'user', text: "After exploring for a while, I'm not that interested in quant anymore. I'm leaning toward AI PM." },
                { type: 'bot', text: "Frank: Got it - your profile has been updated." }
            ]
        ],
        // Section 1: Consent-First Matching
        [
            // Demo 3: Ask for Consent
            [
                { type: 'user', text: "Can you find same-track AI PM upperclassmen or alumni?" },
                { type: 'bot', text: "Frank: I found 3 high-match AI PM alumni:\n1. Nina Park '22 (Meta)\n2. Omar Reed '23 (Ramp)\n3. Lena Wu '24 (Atlassian)\n\nWant me to check if they're open to connecting?" },
                { type: 'user', text: "Yes, ask for consent first." },
                { type: 'bot', text: "Frank: Done. I'll open a three-way chat once both sides say yes." }
            ],
            // Demo 4: Inbound Request
            [
                { type: 'bot', text: "Frank: Heads-up - Riley Chen, a USC alum in product at Notion, wants to connect. Want me to introduce you?" },
                { type: 'user', text: "Yes, please connect us." }
            ]
        ],
        // Section 2: Warm Intros and News Hooks
        [
            // Demo 5: Group Chat Intro
            [
                { type: 'bot', text: "Frank: Both of you are in - welcome to the group chat. Maya is a Duke junior exploring AI PM; Daniel is a Penn alum on product at Stripe." },
                { type: 'user', text: "Maya: Hi Daniel, thanks for making time to chat!" },
                { type: 'bot', text: "Daniel: Hi Maya, happy to connect. Let's dive in." }
            ],
            // Demo 6: News Hook After a Pause
            [
                { type: 'bot', text: "--- 7 days later ---" },
                { type: 'bot', text: "Frank: News hook - the new model release is already shifting internship recruiting timelines. Curious how you both see it." },
                { type: 'user', text: "Maya: If screening gets automated, I'd expect more take-home style evals early." },
                { type: 'bot', text: "Daniel: Agree, and hiring bars might move faster with smaller pipelines." },
                { type: 'user', text: "..." }
            ]
        ],
        // Section 3: Mac Console
        [
            // Demo 7: Sync Notes
            [
                { type: 'user', text: "I updated some relationship notes and tags in the Mac console. Can you see them?" },
                { type: 'bot', text: "Frank: Absolutely. I've synced your network and knowledge base outside iMessage and will use it to improve matching and intros." }
            ],
            // Demo 8: Update Library
            [
                { type: 'user', text: "I just wrapped the Aurora project, updated my resume, and added my notes to the library." },
                { type: 'bot', text: "Frank: Got it. Your knowledge base is updated. That's huge. Future links will be more precise." }
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
                // User types...
                await typeText(msg.text, signal);
                if (signal.aborted) return;

                // Pause before sending
                await wait(MESSAGE_PAUSE);
                if (signal.aborted) return;

                // Send (clear input, add bubble)
                inputField.value = "";
                resizeInputField();
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
