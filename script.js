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

    let index = 0;
    let scrolling = false;
    const gap = 16;
    const showDots = dotsWrap && slides.length <= 12;

    function setSlideSizes() {
      const width = Math.round(viewport.clientWidth);
      slides.forEach(function (slide) {
        slide.style.flex = "0 0 " + width + "px";
        slide.style.width = width + "px";
      });
      track.style.gap = gap + "px";
      return width;
    }

    function updateChrome() {
      if (prevBtn) prevBtn.disabled = index <= 0;
      if (nextBtn) nextBtn.disabled = index >= slides.length - 1;
      if (positionEl) positionEl.textContent = String(index + 1);
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
      const max = slides.length - 1;
      index = Math.min(Math.max(0, nextIndex), max);
      const width = setSlideSizes();
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
      const width = viewport.clientWidth;
      if (width <= 0) return;
      const next = Math.round(viewport.scrollLeft / (width + gap));
      if (next !== index) {
        index = Math.min(Math.max(0, next), slides.length - 1);
        updateChrome();
      }
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function (event) {
        event.preventDefault();
        goTo(index - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", function (event) {
        event.preventDefault();
        goTo(index + 1);
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

    if (countEl) countEl.textContent = String(reviews.length);

    const html = reviews
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
