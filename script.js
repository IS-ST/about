(function () {
  const hero = document.querySelector(".hero");
  if (hero) {
    requestAnimationFrame(function () {
      hero.classList.add("is-ready");
    });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reveals = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initCarousel(root) {
    const viewport = root.querySelector("[data-carousel-viewport]");
    const track = root.querySelector("[data-carousel-track]");
    const slides = Array.prototype.slice.call(
      root.querySelectorAll(".carousel__slide")
    );
    const prevBtn = root.querySelector("[data-carousel-prev]");
    const nextBtn = root.querySelector("[data-carousel-next]");
    const dotsWrap = root.querySelector("[data-carousel-dots]");

    if (!viewport || !track || slides.length === 0) return;

    let index = 0;
    let pageSize = 1;

    function measure() {
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const viewportWidth = viewport.getBoundingClientRect().width;
      pageSize = Math.max(
        1,
        Math.floor((viewportWidth + gap) / (slideWidth + gap))
      );
      const maxIndex = Math.max(0, slides.length - pageSize);
      if (index > maxIndex) index = maxIndex;
      render();
    }

    function renderDots() {
      if (!dotsWrap) return;
      const pages = Math.max(1, slides.length - pageSize + 1);
      dotsWrap.innerHTML = "";
      for (let i = 0; i < pages; i += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot" + (i === index ? " is-active" : "");
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.addEventListener("click", function () {
          index = i;
          render();
        });
        dotsWrap.appendChild(dot);
      }
    }

    function render() {
      const slideWidth = slides[0].getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const maxIndex = Math.max(0, slides.length - pageSize);
      index = Math.min(Math.max(0, index), maxIndex);
      const offset = index * (slideWidth + gap);
      track.style.transform = "translateX(-" + offset + "px)";
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex;
      renderDots();
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        index -= 1;
        render();
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        index += 1;
        render();
      });
    }

    let startX = 0;
    let deltaX = 0;
    let dragging = false;

    viewport.addEventListener(
      "pointerdown",
      function (event) {
        dragging = true;
        startX = event.clientX;
        deltaX = 0;
        viewport.setPointerCapture(event.pointerId);
      },
      { passive: true }
    );

    viewport.addEventListener(
      "pointermove",
      function (event) {
        if (!dragging) return;
        deltaX = event.clientX - startX;
      },
      { passive: true }
    );

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      try {
        viewport.releasePointerCapture(event.pointerId);
      } catch (err) {
        /* ignore */
      }
      if (Math.abs(deltaX) > 40) {
        index += deltaX < 0 ? 1 : -1;
        render();
      }
    }

    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    window.addEventListener("resize", measure);
    measure();
  }

  document.querySelectorAll("[data-carousel]").forEach(initCarousel);
})();
