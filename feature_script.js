document.addEventListener('DOMContentLoaded', () => {
    // Only run this script on the feature page
    if (!document.body.classList.contains('page-feature')) return;

    // --- Configuration ---
    const TYPING_SPEED_MIN = 30;
    const TYPING_SPEED_MAX = 80;
    const MESSAGE_PAUSE = 1000; // Pause before sending
    const REPLY_PAUSE = 1500;   // Pause before bot replies
    const LOOP_PAUSE = 3000;    // Pause before restarting loop

    // --- Data: Scenarios ---
    // Structure: 5 Sections -> Each has 2 Demos -> Each has a conversation array
    const SCENARIOS = [
        // Section 0: Connect People
        [
            // Demo 1: Find People
            [
                { type: 'user', text: "Who are some recent alums working in AI ethics? I want to ask about their day-to-day." },
                { type: 'bot', text: "I found 3 alumni who match that description and were active in the Philosophy Club like you:\n1. Sarah Chen '23 (Anthropic)\n2. David Miller '22 (OpenAI)\n3. Priya Gupta '24 (Hugging Face)\n\nWant to connect with one of them?" }
            ],
            // Demo 2: Cold Email
            [
                { type: 'user', text: "Yeah, Sarah looks great. Can you help me write a cold email to her?" },
                { type: 'bot', text: "Drafting now. Here's a warm approach mentioning your shared club:\n\nSubject: Penn Philosophy Club / Question about AI Ethics\n\nHi Sarah,\nI'm a current junior at Penn and also part of the Philosophy Club. I've been following your work at Anthropic and would love to hear your perspective on transitioning from humanities to technical AI safety...\n\nReady to send?" }
            ]
        ],
        // Section 1: Recommended Resources
        [
            // Demo 3: Clubs
            [
                { type: 'user', text: "I feel like I need to meet more people. Are there any design clubs recruiting?" },
                { type: 'bot', text: "Definitely. Based on your interest in product design, you might like Penn Spark. They have an info session tonight at 7 PM in Huntsman.\n\nThere's also Design for America recruiting next week. Want the details?" }
            ],
            // Demo 4: Events
            [
                { type: 'user', text: "What's happening this weekend? Something low stress." },
                { type: 'bot', text: "There's a Pottery Workshop at the Craft Center on Saturday at 2 PM—spots are filling up fast.\n\nOr, if you want to get off campus, the Philly Art Museum has a student discount day. Shall I add the pottery workshop to your calendar?" }
            ]
        ],
        // Section 2: Calendar & Time Management
        [
            // Demo 5: Add to Calendar
            [
                { type: 'user', text: "I have a midterm for CIS 160 next Thursday at 10 AM." },
                { type: 'bot', text: "Got it. I've added the midterm to your calendar.\n\nI also blocked out two 2-hour study sessions for you on Monday and Tuesday evening. Does that work, or should I move them?" }
            ],
            // Demo 6: Reminders
            [
                { type: 'user', text: "Remind me to submit my resume for the career fair tomorrow morning." },
                { type: 'bot', text: "Will do. I'll nudge you at 9 AM tomorrow.\n\nBy the way, do you want me to review your resume quickly before you submit it?" }
            ]
        ],
        // Section 3: Career Planning
        [
            // Demo 7: Detailed Plan
            [
                { type: 'user', text: "I want to get into Product Management, but I have no experience. What should I do this summer?" },
                { type: 'bot', text: "It's not too late. Here is a 3-step plan for this summer:\n1. Build a side project: We can brainstorm ideas this weekend.\n2. Get a certificate: The Google PM certificate is a good start.\n3. Network: Connect with 5 PM alums (I can find them for you).\n\nWhich one do you want to start with?" }
            ],
            // Demo 8: Long-term Memory
            [
                { type: 'user', text: "I'm updating my resume. What did I actually accomplish last semester?" },
                { type: 'bot', text: "You did a lot! Here's a recap:\n• Led the marketing team for the Hackathon (raised $5k).\n• Built that React app for your final project.\n• Volunteered at the local shelter every Saturday.\n\nI can bullet-point these for your resume if you like." }
            ]
        ],
        // Section 4: Emotional Support
        [
            // Demo 9: Offer Rejection
            [
                { type: 'user', text: "I didn't get the internship at Google. I feel like a failure." },
                { type: 'bot', text: "I'm really sorry to hear that. It sucks, and it's okay to be upset.\n\nRemember: this one 'no' doesn't erase your skills or your worth. You still have 3 other active applications, and your portfolio is strong. Take tonight off, and we can look at next steps tomorrow." }
            ],
            // Demo 10: Venting
            [
                { type: 'user', text: "I am so overwhelmed. Everyone else seems to have it figured out." },
                { type: 'bot', text: "I promise you, they don't. They're just posting the highlights.\n\nYou're doing the work, and that's what matters. Take a deep breath. Is there one small thing we can get off your plate right now to make tonight easier?" }
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

    // --- Animation Logic ---

    // 1. Type text into input field
    async function typeText(text, signal) {
        inputField.value = "";
        for (let i = 0; i < text.length; i++) {
            if (signal.aborted) return;
            inputField.value += text[i];
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
        // Clear chat at start of new demo sequence? 
        // Or maybe just keep appending? Let's clear for cleaner look per demo loop.
        // Actually, let's clear at the start of the section loop, not every demo.

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

        // Immediate cleanup for visual responsiveness
        chatArea.innerHTML = '';
        inputField.value = '';

        try {
            while (!signal.aborted) {
                // Loop through the 2 demos for this section
                for (const demo of demos) {
                    if (signal.aborted) break;

                    // Run the demo
                    await runDemo(demo, signal);

                    if (signal.aborted) break;

                    // Wait before next demo
                    await wait(LOOP_PAUSE);
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
