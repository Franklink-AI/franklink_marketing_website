# Franklink Marketing Website

A modern, animated marketing website for Franklink - an AI Career Agent in iMessage that helps college students with career events and follow-ups.

Main entry point: `index.html` (feature showcase homepage).
Legacy two-demo landing page: `old-index-with-two-demo.html`.

## Features

- **Feature Showcase Homepage**: Scroll-synced iMessage demo with dynamic typing inside a sticky phone frame
- **Animated iMessage Demo**: Messages slide in with smooth animations on page load/refresh
- **Interactive Phone Flip**: Hover over the phone to see "3 Days After" text, followed by a 3D flip animation showing the follow-up demo
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Smooth Animations**: Scroll-based animations for stats and content sections
- **Modern UI**: Clean, professional design with gradient effects and smooth transitions
- **Legal Compliance**: Complete privacy policy, terms of service, and data deletion instructions
- **Unified Footer**: Consistent footer on all pages with legal links and copyright
- **Legacy Two-Demo Page**: Previous homepage preserved at `old-index-with-two-demo.html`

## Project Structure

```
franklink_marketing_website/
├── index.html                 # Main marketing page (feature showcase homepage)
├── old-index-with-two-demo.html # Legacy two-demo landing page
├── about.html                 # About page
├── team.html                  # Team page
├── faq.html                   # FAQ page
├── contact.html               # Contact page
├── privacy.html               # Privacy Policy
├── terms.html                 # Terms of Service
├── data-deletion.html         # Data Deletion Instructions
├── styles.css                 # Global styles and animations
├── script.js                  # JavaScript interactions
├── /assets/images/branding/franklink-banner-2.png     # Brand logo
├── assets/images/demos/imessage/       # Product demo images
│   ├── phone-one/                      # Activity discovery demo (11 images)
│   └── phone-two/                      # Follow-up resources demo (11 images)
├── agreements/                # Legal markdown source files
│   ├── PRIVACY_POLICY.md
│   ├── TERMS_OF_SERVICE.md
│   └── DATA_DELETION_INSTRUCTIONS.md
├── placeholder-images.html   # Generate placeholder images
├── server.py                 # Python development server
├── CNAME                     # Domain configuration
├── DEPLOYMENT_GUIDE.md       # Deployment instructions
└── README.md                 # This file
```

## Setup Instructions

1. **Open the Website**
   - Simply open `index.html` in a modern web browser (Chrome, Firefox, Safari, Edge)
   - For the legacy two-demo page, open `old-index-with-two-demo.html`

2. **Image Setup**
   - The website uses your existing PNG files for the Franklink logo
   - For missing images (speaker photo, company logos), either:
     - Add your own images with the filenames referenced in the HTML
     - Or open `placeholder-images.html` to generate and save placeholder images

3. **Customization**
   - Edit `index.html` to update feature messaging and homepage content
   - Edit `old-index-with-two-demo.html` to update legacy demo content
   - Modify `styles.css` to adjust colors, spacing, or animations
   - Update `script.js` to change animation timing or add new interactions

## Key Animations

### 1. Message Slide-In Animation
- Messages and event cards slide in sequentially when the page loads
- Timing can be adjusted via `animation-delay` in the HTML

### 2. Phone Flip Interaction
- Hover over the phone for 1.5 seconds to trigger the flip
- Shows "3 Days After" indicator during hover
- Smooth 3D rotation to reveal the follow-up conversation

### 3. Scroll Animations
- Stats, CTA button, and quote sections animate in as you scroll
- Parallax effect on the phone for depth

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Notes

- The website is built with vanilla HTML, CSS, and JavaScript (no frameworks required)
- All animations use CSS3 and JavaScript for maximum performance
- The design is optimized for fast loading and smooth interactions
- Legal pages use a consistent `.legal-page` class for uniform styling
- Footer is centrally managed and appears on all pages for consistency

## Legal Compliance

This website includes comprehensive legal documentation:

- **Privacy Policy**: Detailed privacy policy with Google OAuth compliance
- **Terms of Service**: Complete terms covering service usage, disclaimers, and liability
- **Data Deletion**: Clear instructions on how users can delete their data
- All legal documents are accessible via the unified footer on every page

The legal documentation is:
- Professionally structured with clear sections
- Compliant with major data protection regulations (GDPR, CCPA)
- Includes Google API Services User Data Policy compliance
- Ready for technical due diligence review

## Future Enhancements

Consider adding:
- Integration with actual iMessage/SMS links
- Backend API for dynamic event loading
- User analytics tracking
- A/B testing for different messaging
- More interactive demos or case studies
- Video backgrounds or testimonials

## Contact

For questions or support with the Franklink marketing website, please reach out to your development team.

---

Built with ❤️ for Franklink - Your AI Career Companion
