document.addEventListener("DOMContentLoaded", async () => {
    const containers = document.querySelectorAll("[data-nav-active]");
    if (!containers.length) {
        return;
    }

    try {
        const response = await fetch("/partials/nav.html");
        if (!response.ok) {
            throw new Error(`Failed to load nav: ${response.status}`);
        }

        const html = await response.text();

        containers.forEach((container) => {
            const wrapper = document.createElement("div");
            wrapper.innerHTML = html.trim();
            const nav = wrapper.firstElementChild;
            if (!nav) {
                return;
            }

            const activeKey = container.dataset.navActive;
            if (activeKey && activeKey !== "none") {
                const activeLink = nav.querySelector(`[data-nav="${activeKey}"]`);
                if (activeLink) {
                    activeLink.classList.add("active");
                }
            }

            container.replaceWith(nav);
        });
    } catch (error) {
        console.error(error);
    }
});
