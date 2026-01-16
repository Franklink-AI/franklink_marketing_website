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
