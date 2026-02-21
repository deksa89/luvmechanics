// assets/accordion-animate.js
(() => {
  const DURATION = 880; // ms (increase for "slower")
  const EASING = "cubic-bezier(0.2, 0, 0, 1)";

  const prefersReducedMotion = () =>
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateDetails(details) {
    const summary = details.querySelector("summary");
    const content = details.querySelector(".accordion__content");
    if (!summary || !content) return;

    let isAnimating = false;

    summary.addEventListener("click", (e) => {
      // Let links inside summary work normally
      if (e.target && e.target.closest && e.target.closest("a")) return;

      // If user prefers reduced motion, keep native behavior
      if (prefersReducedMotion()) return;

      e.preventDefault();
      if (isAnimating) return;

      isAnimating = true;

      const isOpen = details.hasAttribute("open");

      // Ensure we have a measurable start height
      content.style.overflow = "hidden";

      if (!isOpen) {
        // OPEN
        details.setAttribute("open", "");

        // Start from 0 -> scrollHeight
        content.style.height = "0px";

        // Force reflow so the browser applies height=0 before animating
        content.offsetHeight; // eslint-disable-line no-unused-expressions

        const endHeight = content.scrollHeight;

        content
          .animate([{ height: "0px" }, { height: `${endHeight}px` }], {
            duration: DURATION,
            easing: EASING,
          })
          .addEventListener("finish", () => {
            content.style.height = ""; // back to auto
            content.style.overflow = "";
            isAnimating = false;
          });
      } else {
        // CLOSE
        const startHeight = content.scrollHeight;
        content.style.height = `${startHeight}px`;

        // Force reflow
        content.offsetHeight; // eslint-disable-line no-unused-expressions

        content
          .animate([{ height: `${startHeight}px` }, { height: "0px" }], {
            duration: DURATION,
            easing: EASING,
          })
          .addEventListener("finish", () => {
            details.removeAttribute("open");
            content.style.height = "";
            content.style.overflow = "";
            isAnimating = false;
          });
      }
    });
  }

  function init() {
    document.querySelectorAll(".product__accordion details").forEach(animateDetails);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
