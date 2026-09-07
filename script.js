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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
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
    const positionEl = root.querySelector("[data-review-position]");
    const totalEl = root.querySelector("[data-review-total]");

    if (!viewport || !track || slides.length === 0) return;

    const gap = 16;
    const configuredPageSize = parseInt(root.getAttribute("data-carousel-page-size"), 10);
    let pageSize = configuredPageSize > 0 ? configuredPageSize : 1;
    let index = 0;
    let scrolling = false;
    const showDots = dotsWrap && slides.length <= 12 && pageSize === 1;

    function visiblePageSize() {
      if (configuredPageSize > 1 && window.matchMedia("(max-width: 720px)").matches) {
        return 1;
      }
      return configuredPageSize > 0 ? configuredPageSize : 1;
    }

    function setSlideSizes() {
      pageSize = visiblePageSize();
      const width = Math.max(
        1,
        Math.floor((viewport.clientWidth - gap * (pageSize - 1)) / pageSize)
      );
      slides.forEach(function (slide) {
        slide.style.flex = "0 0 " + width + "px";
        slide.style.width = width + "px";
      });
      track.style.gap = gap + "px";
      return width;
    }

    function maxIndex() {
      return Math.max(0, slides.length - pageSize);
    }

    function snapIndex(value) {
      const max = maxIndex();
      const snapped = Math.round(value / pageSize) * pageSize;
      return Math.min(Math.max(0, snapped), max);
    }

    function updateChrome() {
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= maxIndex();

      if (positionEl) {
        const start = index + 1;
        const end = Math.min(index + pageSize, slides.length);
        positionEl.textContent = pageSize > 1 ? start + "–" + end : String(start);
      }
      if (totalEl) totalEl.textContent = String(slides.length);

      if (!dotsWrap) return;
      if (!showDots) {
        dotsWrap.innerHTML = "";
        dotsWrap.hidden = true;
        return;
      }

      dotsWrap.hidden = false;
      dotsWrap.innerHTML = "";
      slides.forEach(function (_slide, i) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel__dot" + (i === index ? " is-active" : "");
        dot.setAttribute("aria-label", "Go to slide " + (i + 1));
        dot.addEventListener("click", function () {
          goTo(i);
        });
        dotsWrap.appendChild(dot);
      });
    }

    function goTo(nextIndex, instant) {
      const width = setSlideSizes();
      index = snapIndex(nextIndex);
      scrolling = true;
      viewport.scrollTo({
        left: index * (width + gap),
        behavior: instant || reduceMotion ? "auto" : "smooth",
      });
      updateChrome();
      window.setTimeout(function () {
        scrolling = false;
      }, reduceMotion ? 0 : 500);
    }

    function syncFromScroll() {
      if (scrolling) return;
      const width = setSlideSizes();
      if (width <= 0) return;
      const next = Math.round(viewport.scrollLeft / (width + gap));
      const snapped = snapIndex(next);
      if (snapped !== index) {
        index = snapped;
        updateChrome();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function (event) {
        event.preventDefault();
        goTo(index - pageSize);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function (event) {
        event.preventDefault();
        goTo(index + pageSize);
      });
    }

    viewport.addEventListener("scroll", syncFromScroll, { passive: true });

    let resizeTimer = 0;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        goTo(index, true);
      }, 100);
    });

    setSlideSizes();
    updateChrome();
  }

  function renderReviews(reviews) {
    const root = document.querySelector("[data-carousel-reviews]");
    if (!root) return;

    const track = root.querySelector("[data-carousel-track]");
    const countEl = document.querySelector("[data-review-count]");
    const section = document.getElementById("reviews");
    if (!track) return;

    const sorted = reviews.slice().sort(function (a, b) {
      return String(b.text || "").length - String(a.text || "").length;
    });

    if (countEl) countEl.textContent = String(sorted.length);

    const html = sorted
      .map(function (review) {
        const name = escapeHtml(review.name || "Client");
        const store = escapeHtml(review.store || "");
        const text = escapeHtml(review.text || "");
        const cite = store ? name + " · " + store : name;
        return (
          '<li class="carousel__slide">' +
          '<blockquote class="review">' +
          "<p>" +
          text +
          "</p>" +
          "<footer><cite>" +
          cite +
          "</cite></footer>" +
          "</blockquote>" +
          "</li>"
        );
      })
      .join("");

    track.innerHTML = html;
    if (section) section.classList.add("is-visible");
    initCarousel(root);
  }

  document.querySelectorAll("[data-carousel]:not([data-carousel-reviews])").forEach(initCarousel);

  if (Array.isArray(window.PORTFOLIO_REVIEWS) && window.PORTFOLIO_REVIEWS.length) {
    renderReviews(window.PORTFOLIO_REVIEWS);
  } else {
    const track = document.querySelector("[data-carousel-reviews] [data-carousel-track]");
    if (track) {
      track.innerHTML =
        '<li class="carousel__slide"><blockquote class="review"><p>Reviews are temporarily unavailable.</p></blockquote></li>';
      initCarousel(document.querySelector("[data-carousel-reviews]"));
    }
  }
})();
