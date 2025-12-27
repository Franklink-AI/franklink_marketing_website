# Feature Page Implementation Plan

## Goal
Redesign the `feature.html` page to feature a "sticky" interactive iPhone demo on the left and scrollable feature descriptions on the right. The phone should simulate real-time typing and messaging conversations relevant to the visible feature section.

## Architecture
*   **Layout:** CSS Grid / Flexbox.
    *   **Desktop:** Split screen. Left column (50%) is sticky and holds the Phone. Right column (50%) scrolls through 5 sections.
    *   **Mobile:** Stacked. Phone on top (static or simplified animation), text below.
*   **Scroll Interaction:** `IntersectionObserver` to detect which text section is currently in the viewport and trigger the corresponding phone demo.

## Phone Demo Implementation Options

### Option A: DOM Manipulation (Recommended)
We build the phone screen using standard HTML/CSS elements (`div`, `input`, `ul`).
*   **Pros:**
    *   **Realistic Typing:** We can animate the value of the `<input>` field character-by-character (`v`, `va`, `val`, `valu`, `value`).
    *   **Styling:** Uses the same CSS variables as the rest of the site. Crisp text on all devices.
    *   **Accessibility:** Screen readers can read the conversation.
    *   **Maintainability:** Easy to change text in the future without re-recording videos.
*   **Cons:** Requires careful CSS to match iOS look exactly (bubbles, shadows, font).

### Option B: HTML5 Canvas
Render the entire phone screen on a `<canvas>` element.
*   **Pros:** High performance if we had thousands of particles (not the case here).
*   **Cons:** Text rendering can look blurry on high-DPI screens if not handled perfectly. Harder to style. Not accessible.

### Option C: Pre-rendered Videos
Play a video file for each section.
*   **Pros:** Pixel-perfect iOS look (if recorded from a real device).
*   **Cons:** Large file sizes (slow load). No interactive "typing" feel (just watching a movie). Hard to update content.

**Recommendation:** **Option A**. It fits the "pure HTML/CSS/JS" stack perfectly and delivers the most "alive" feel.

## Technical Details (Option A)

### 1. HTML Structure
```html
<div class="feature-container">
  <div class="sticky-phone-wrapper">
    <div class="iphone-frame">
      <!-- Dynamic Island, Bezel, etc. -->
      <div class="screen-content">
        <div class="chat-area" id="chat-area"></div>
        <div class="input-area">
          <input type="text" id="phone-input" readonly>
          <button class="send-btn">↑</button>
        </div>
      </div>
    </div>
  </div>
  
  <div class="scrollable-content">
    <section id="feature-1" data-index="0">...</section>
    <section id="feature-2" data-index="1">...</section>
    <!-- ... -->
  </div>
</div>
```

### 2. CSS Styling
*   **Scroll Snapping:** Use `scroll-snap-type: y mandatory` on the container and `scroll-snap-align: start` on sections for a premium feel.
*   **iOS Fidelity:** Use specific border-radius, box-shadows, and the San Francisco font stack (available on Apple devices, fallback to sans-serif) to mimic iMessage.
*   **Animations:** CSS classes for `.message-bubble.enter` (slide up + fade in).

### 3. JavaScript Logic
*   **State Management:** Track `currentSectionIndex` and `isAnimating`.
*   **Typing Engine:**
    ```javascript
    async function typeText(text) {
      for (let char of text) {
        input.value += char;
        await wait(random(50, 150)); // Realistic typing speed variation
      }
    }
    ```
*   **Scenario Runner:**
    *   Define scenarios as arrays of objects: `[{ type: 'user', text: '...' }, { type: 'bot', text: '...' }]`.
    *   When a section comes into view:
        1.  Clear previous chat.
        2.  Start Loop: Run Demo 1 -> Wait -> Clear -> Run Demo 2 -> Wait -> Clear -> Repeat.

## Assets Needed
*   `phone.png` (You confirmed this exists).
*   (Optional) Sound effects for typing/sent message (can add later if desired).

## Plan of Action
1.  **Backup:** Save current `feature.html` content.
2.  **Skeleton:** Create the new split-screen layout in `feature.html`.
3.  **Styles:** Add iOS-specific styles to `styles.css`.
4.  **Logic:** Implement the `ScenarioRunner` class in `script.js`.
5.  **Content:** Populate the 5 sections with the text from `feature_content.md`.
