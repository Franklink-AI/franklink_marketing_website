// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initializeAnimations();
    handlePhoneInteraction();
    initScrollAnimations();
    handleNavigation();
    setupPhoneToggle();
    setupHamburgerMenu();
    initHeroTextAnimation();  // Hero → Text Transition Animation on mobile
});

// Initialize message animations on page load
function initializeAnimations() {
    const leftSlideElements = document.querySelectorAll('.slide-in-left');
    const rightSlideElements = document.querySelectorAll('.slide-in-right');
    const allAnimatedElements = [...leftSlideElements, ...rightSlideElements];

    // Also handle resource cards
    const resourceCards = document.querySelectorAll('.resource-card');
    allAnimatedElements.push(...resourceCards);

    // Reset animations on page load/refresh
    allAnimatedElements.forEach(element => {
        element.style.opacity = '0';
        element.style.animation = 'none';

        // Force browser to recalculate styles
        element.offsetHeight;

        // Reapply animation
        element.style.animation = null;
    });

    // Trigger animations with proper delays
    setTimeout(() => {
        allAnimatedElements.forEach((element, index) => {
            const delay = parseFloat(element.style.animationDelay || '0s');
            setTimeout(() => {
                element.style.opacity = '1';
            }, delay * 1000);
        });
    }, 100);
}

// Placeholder for future phone interactions
function handlePhoneInteraction() {
    // Phone flipping functionality has been removed
    // This function is kept for potential future interactions
}

// Phone toggle animation system
let currentPhone = 1;
let isAnimating = false;

function setupPhoneToggle() {
    const overlay = document.getElementById('hover-overlay');
    const phoneOne = document.getElementById('phone-one');
    const phoneTwo = document.getElementById('phone-two');

    // Click handler for overlay
    if (overlay) {
        overlay.addEventListener('click', togglePhones);
    }

    // Click handlers for phones
    if (phoneOne) {
        phoneOne.addEventListener('click', togglePhones);
    }

    if (phoneTwo) {
        phoneTwo.addEventListener('click', togglePhones);
    }
}

function togglePhones() {
    if (isAnimating) return;
    isAnimating = true;

    const phoneOne = document.getElementById('phone-one');
    const phoneTwo = document.getElementById('phone-two');
    const overlay = document.getElementById('hover-overlay');

    // Hide overlay during transition
    if (overlay) {
        overlay.style.display = 'none';
    }

    if (currentPhone === 1) {
        // Animate phone 1 elements out
        animatePhoneOut(phoneOne);

        // After slide-out animation, switch phones
        setTimeout(() => {
            phoneOne.style.display = 'none';
            phoneTwo.style.display = 'flex';

            // Reset and trigger animations for phone 2
            resetAnimations(phoneTwo);
            setTimeout(() => {
                animatePhoneIn(phoneTwo);
                currentPhone = 2;
                isAnimating = false;
            }, 100);
        }, 600);
    } else {
        // Animate phone 2 elements out
        animatePhoneOut(phoneTwo);

        // After slide-out animation, switch phones
        setTimeout(() => {
            phoneTwo.style.display = 'none';
            phoneOne.style.display = 'flex';

            // Reset and trigger animations for phone 1
            resetAnimations(phoneOne);
            setTimeout(() => {
                animatePhoneIn(phoneOne);
                currentPhone = 1;
                isAnimating = false;
            }, 100);
        }, 600);
    }
}

function animatePhoneOut(phoneElement) {
    const leftElements = phoneElement.querySelectorAll('.slide-in-left');
    const rightElements = phoneElement.querySelectorAll('.slide-in-right');

    // Animate elements out in reverse direction
    leftElements.forEach((el, index) => {
        el.style.animation = `slideOutToLeft 0.5s ease-in forwards`;
        el.style.animationDelay = `${index * 0.1}s`;
    });

    rightElements.forEach((el, index) => {
        el.style.animation = `slideOutToRight 0.5s ease-in forwards`;
        el.style.animationDelay = `${index * 0.1}s`;
    });
}

function resetAnimations(phoneElement) {
    const allAnimatedElements = phoneElement.querySelectorAll('.slide-in-left, .slide-in-right, .resource-card, .content-image');

    allAnimatedElements.forEach(element => {
        element.style.animation = 'none';
        element.style.opacity = '0';
        // Force browser to recalculate styles
        element.offsetHeight;
    });
}

function animatePhoneIn(phoneElement) {
    const leftElements = phoneElement.querySelectorAll('.slide-in-left');
    const rightElements = phoneElement.querySelectorAll('.slide-in-right');
    const resourceCards = phoneElement.querySelectorAll('.resource-card');

    // Apply slide-in animations with delays
    leftElements.forEach((el, index) => {
        const originalDelay = el.getAttribute('data-delay') || `${0.5 + index * 0.5}s`;
        el.style.animation = `slideInFromLeft 0.6s ease-out forwards`;
        el.style.animationDelay = originalDelay;
    });

    rightElements.forEach((el, index) => {
        const originalDelay = el.getAttribute('data-delay') || `${0.5 + index * 0.5}s`;
        el.style.animation = `slideInFromRight 0.6s ease-out forwards`;
        el.style.animationDelay = originalDelay;
    });

    resourceCards.forEach((el, index) => {
        if (el.classList.contains('slide-in-left')) {
            const originalDelay = el.getAttribute('data-delay') || `${2 + index * 0.5}s`;
            el.style.animation = `slideInFromLeft 0.6s ease-out forwards`;
            el.style.animationDelay = originalDelay;
        } else if (el.classList.contains('slide-in-right')) {
            const originalDelay = el.getAttribute('data-delay') || `${2 + index * 0.5}s`;
            el.style.animation = `slideInFromRight 0.6s ease-out forwards`;
            el.style.animationDelay = originalDelay;
        }
    });
}

// Scroll-based animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animateElements = document.querySelectorAll('.stat-item, .cta-button, .description, .main-quote');
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.8s ease-out';
        observer.observe(element);
    });
}

// Add animate-in class styles dynamically
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

// Smooth scrolling for navigation links
function handleNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Check if it's an internal link
            if (href.startsWith('#')) {
                e.preventDefault();

                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                } else {
                    // If section doesn't exist, scroll to top
                    window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Get responsive parallax speed based on viewport width
function getParallaxSpeed() {
    const isMobile = window.innerWidth < 600;
    return isMobile ? 0.50 : 0;  // Mobile: 0.50x more exit speed, Desktop: 0 (no parallax, normal scroll)
}

// Add parallax effect to phone on scroll with responsive speed
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const phoneContainer = document.querySelector('.phone-container');

    if (phoneContainer) {
        const speed = getParallaxSpeed();
        // Only apply transform if speed is not 0 (no parallax on desktop)
        if (speed === 0) {
            phoneContainer.style.transform = 'none';
        } else {
            const yPos = -(scrolled * speed);
            phoneContainer.style.transform = `translateY(${yPos}px)`;
        }
    }
});

// Update parallax speed on viewport resize
window.addEventListener('resize', function() {
    // Parallax speed automatically recalculates on next scroll event
    // No explicit recalculation needed - getParallaxSpeed() reads current window.innerWidth
});

// ==================== HERO TEXT TRANSITION ANIMATION ====================
/**
 * Initialize Hero → Text Transition Animation on mobile displays
 * Text fades in and slides up as user scrolls during phone parallax exit
 * Animation is synchronized with the phone's parallax exit (getParallaxSpeed)
 */
let animationFrameId = null;

function initHeroTextAnimation() {
    const textSection = document.querySelector('.text-section');
    if (!textSection) return;

    // Configuration
    const ANIMATION_DISTANCE = 450; // Scroll distance over which animation occurs (pixels)
    const SLIDE_DISTANCE = 30; // How far text slides up (pixels)

    // Track if animation should be active based on viewport width
    let isAnimationActive = window.innerWidth < 600;

    /**
     * Update text animation based on scroll progress
     * Called via requestAnimationFrame to prevent jank
     */
    function updateTextAnimation() {
        if (!isAnimationActive) {
            // On desktop, ensure text is visible
            textSection.style.opacity = '1';
            textSection.style.transform = 'translateY(0)';
            return;
        }

        const scrolled = window.pageYOffset;

        // Calculate animation progress: 0 (start) to 1 (complete)
        // Progress is tied to scroll distance, not time
        let progress = scrolled / ANIMATION_DISTANCE;

        // Clamp progress to [0, 1] to prevent over-animation
        progress = Math.max(0, Math.min(1, progress));

        // Apply linear easing:
        // - opacity: goes from 0 to 1 as user scrolls
        // - translateY: goes from 30px to 0 as user scrolls
        const opacity = progress;
        const translateY = SLIDE_DISTANCE * (1 - progress);

        textSection.style.opacity = opacity;
        textSection.style.transform = `translateY(${translateY}px)`;
    }

    /**
     * Scroll event handler with requestAnimationFrame throttling
     * Prevents jank on mobile devices by batching DOM updates
     */
    function onScroll() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        animationFrameId = requestAnimationFrame(updateTextAnimation);
    }

    /**
     * Viewport resize handler
     * Enables/disables animation based on breakpoint (< 600px)
     */
    function onResize() {
        const wasMobile = isAnimationActive;
        isAnimationActive = window.innerWidth < 600;

        // If transitioning from desktop to mobile, reset to initial state
        if (!wasMobile && isAnimationActive) {
            textSection.style.opacity = '0';
            textSection.style.transform = `translateY(${SLIDE_DISTANCE}px)`;
        }
        // If transitioning from mobile to desktop, show immediately
        else if (wasMobile && !isAnimationActive) {
            textSection.style.opacity = '1';
            textSection.style.transform = 'translateY(0)';
        }
    }

    // Set up event listeners
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);

    // Initial state: ensure text is hidden on mobile, visible on desktop
    if (isAnimationActive) {
        textSection.style.opacity = '0';
        textSection.style.transform = `translateY(${SLIDE_DISTANCE}px)`;
    } else {
        textSection.style.opacity = '1';
        textSection.style.transform = 'translateY(0)';
    }
}

// Refresh animations when tab becomes visible again
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        initializeAnimations();
    }
});

// ==================== CTA Button Handler ====================
// Note: iMessage redirect logic is now in imessage-redirect.html
// This button simply opens the redirect page in a new tab (via HTML href + target="_blank")

// Add hover animation to CTA button (visual feedback only)
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) {
    // Add ARIA label for accessibility
    ctaButton.setAttribute('aria-label', 'Talk to Frank Now - Opens iMessage redirect in new tab');
}

// Easter egg: Konami code for fun animation
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', function(e) {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);

    if (konamiCode.join(',') === konamiPattern.join(',')) {
        triggerEasterEgg();
    }
});

function triggerEasterEgg() {
    const phoneWrapper = document.querySelector('.phone-wrapper');
    phoneWrapper.style.animation = 'spin 1s ease-in-out';

    setTimeout(() => {
        phoneWrapper.style.animation = '';
    }, 1000);
}

// Add spin animation
const spinStyle = document.createElement('style');
spinStyle.textContent = `
    @keyframes spin {
        0% { transform: rotateY(0deg) scale(1); }
        50% { transform: rotateY(180deg) scale(1.1); }
        100% { transform: rotateY(360deg) scale(1); }
    }
`;
document.head.appendChild(spinStyle);

// ==================== NEW SECTIONS FUNCTIONALITY ====================

// FAQ Accordion Functionality
function initializeFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isOpen = answer.classList.contains('open');

            // Toggle active class on question for chevron rotation
            question.classList.toggle('active');

            // Toggle answer visibility
            if (isOpen) {
                answer.classList.remove('open');
            } else {
                answer.classList.add('open');
            }
        });
    });
}

// Contact Form Validation
function initializeContactForm() {
    const form = document.querySelector('.contact-form');

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form values
            const name = form.querySelector('[name="name"]').value.trim();
            const email = form.querySelector('[name="email"]').value.trim();
            const phone = form.querySelector('[name="phone"]').value.trim();
            const message = form.querySelector('[name="message"]').value.trim();

            // Validate required fields
            if (!name || !email || !phone || !message) {
                alert('Please fill in all required fields.');
                return;
            }

            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address.');
                return;
            }

            // Phase 1: Show coming soon message
            alert('Thank you for your interest! Our contact form is coming soon. Please email us directly at bialpha@seas.upenn.edu or cicicai@berkeley.edu for immediate assistance.');

            // Future: Submit to backend
            // fetch('/api/contact', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ name, email, phone, message })
            // });
        });
    }
}

// Enhanced scroll animation for new sections
function initNewSectionAnimations() {
    const fadeInElements = document.querySelectorAll('.fade-in-element');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-50px'
    });

    fadeInElements.forEach(element => {
        observer.observe(element);
    });
}

// Enhanced smooth scroll with navbar offset
function initSmoothScrollWithOffset() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');

            if (targetId === '#' || targetId === '#home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            const target = document.querySelector(targetId);
            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.offsetTop - navbarHeight - 20;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });
}

// Initialize all new functionality
document.addEventListener('DOMContentLoaded', () => {
    initializeFAQ();
    initializeContactForm();
    initNewSectionAnimations();
    initSmoothScrollWithOffset();
});

// ==================== MARKDOWN LOADER FOR LEGAL PAGES ====================

/**
 * Convert basic Markdown to HTML
 * Supports: headings, bold, italic, links, lists, code blocks, inline code, tables, hr
 * @param {string} markdown - Markdown text
 * @returns {string} HTML text
 */
function convertMarkdownToHTML(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Escape HTML special characters first
    html = html.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;');

    // Convert tables
    html = html.replace(/^\|(.+?)\|$/gm, (match, p1) => {
        const cells = p1.split('|').map(cell => cell.trim());
        const isHeaderRow = cells.some(cell => cell.includes('---'));
        if (isHeaderRow) return ''; // Skip separator rows
        return '<tr>' + cells.map(cell => `<td>${cell}</td>`).join('') + '</tr>';
    });

    // Wrap consecutive table rows in table
    html = html.replace(/(<tr>.*?<\/tr>\s*)+/g, (match) => {
        return `<table>${match}</table>`;
    });

    // Convert links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Convert bold **text**
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

    // Convert italic *text* (avoid interfering with **)
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');

    // Convert code blocks ```code```
    html = html.replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>');

    // Convert inline code `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert horizontal rules ---
    html = html.replace(/^---+$/gm, '<hr>');

    // Convert headings (must be done before lists)
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Convert list items
    html = html.replace(/^\s*[-\*] (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive list items in ul
    html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
        return `<ul>${match}</ul>`;
    });

    // Convert paragraphs (lines not starting with tags)
    // Split by newlines and process each line
    const lines = html.split('\n');
    let inParagraph = false;
    let result = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Skip empty lines
        if (!line) {
            if (inParagraph) {
                result += '</p>\n';
                inParagraph = false;
            }
            continue;
        }

        // If line starts with a block element, close paragraph if open
        if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<table') ||
            line.startsWith('<pre') || line.startsWith('<hr')) {
            if (inParagraph) {
                result += '</p>\n';
                inParagraph = false;
            }
            result += line + '\n';
        }
        // If line doesn't start with a tag, it's a paragraph
        else if (!line.startsWith('<')) {
            if (!inParagraph) {
                result += '<p>' + line;
                inParagraph = true;
            } else {
                result += ' ' + line;
            }
        } else {
            result += line + '\n';
        }
    }

    // Close paragraph if still open
    if (inParagraph) {
        result += '</p>\n';
    }

    return result;
}

/**
 * Load and render a Markdown file
 * @param {string} filename - Path to the markdown file
 * @param {string} containerId - ID of the element to insert content into
 */
async function loadMarkdownFile(filename, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}: ${response.status}`);
        }

        const markdown = await response.text();
        const html = convertMarkdownToHTML(markdown);

        container.innerHTML = html;
    } catch (error) {
        console.error('Error loading markdown file:', error);
        container.innerHTML = '<p style="color: red; padding: 2rem;">Error loading content. Please refresh the page.</p>';
    }
}

/**
 * Initialize legal page content loading
 * Called on DOMContentLoaded
 */
function initializeLegalPages() {
    // Check current page and load corresponding markdown
    const path = window.location.pathname;
    const filename = path.split('/').pop();

    if (filename === 'privacy.html' || path.endsWith('/privacy.html')) {
        loadMarkdownFile('../agreements/PRIVACY_POLICY.md', 'privacy-content');
    } else if (filename === 'terms.html' || path.endsWith('/terms.html')) {
        loadMarkdownFile('../agreements/TERMS_OF_SERVICE.md', 'terms-content');
    } else if (filename === 'data-deletion.html' || path.endsWith('/data-deletion.html')) {
        loadMarkdownFile('../agreements/DATA_DELETION_INSTRUCTIONS.md', 'data-deletion-content');
    }
}

// ==================== HAMBURGER MENU FUNCTIONALITY ====================

/**
 * Setup hamburger menu toggle and drawer functionality
 * Handles open/close animations and overlay interactions
 */
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    const navOverlay = document.getElementById('nav-overlay');
    const navLinks = navDrawer.querySelectorAll('a');

    if (!hamburgerBtn || !navDrawer || !navOverlay) {
        console.warn('Hamburger menu elements not found');
        return;
    }

    /**
     * Toggle drawer open/close state
     */
    function toggleDrawer() {
        hamburgerBtn.classList.toggle('active');
        navDrawer.classList.toggle('active');
        navOverlay.classList.toggle('active');
    }

    /**
     * Close drawer
     */
    function closeDrawer() {
        hamburgerBtn.classList.remove('active');
        navDrawer.classList.remove('active');
        navOverlay.classList.remove('active');
    }

    // Hamburger button click
    hamburgerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleDrawer();
    });

    // Overlay click to close drawer
    navOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
    });

    // Nav link click to close drawer
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeDrawer();
        });
    });

    // Close drawer on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeDrawer();
        }
    });
}