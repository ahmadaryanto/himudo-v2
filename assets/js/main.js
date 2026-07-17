/* Himudo — interactions
   Emil-style: ease-out reveals, stagger, press feedback in CSS
*/

(function () {
  "use strict";

  const header = document.getElementById("header");
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const yearEl = document.getElementById("year");
  const contactForm = document.getElementById("contactForm");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Sticky island state */
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  function setMenuOpen(open) {
    if (!mobileMenu || !navToggle) return;

    if (open) {
      mobileMenu.hidden = false;
      // force reflow so transition runs
      void mobileMenu.offsetWidth;
      mobileMenu.classList.add("is-open");
      navToggle.setAttribute("aria-expanded", "true");
      navToggle.setAttribute("aria-label", "Tutup menu");
      document.body.classList.add("menu-open");
    } else {
      mobileMenu.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Buka menu");
      document.body.classList.remove("menu-open");
      window.setTimeout(() => {
        if (!mobileMenu.classList.contains("is-open")) {
          mobileMenu.hidden = true;
        }
      }, 280);
    }
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") !== "true";
      setMenuOpen(open);
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenuOpen(false));
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setMenuOpen(false);
      }
    });

    // Close when resizing to desktop nav
    const mq = window.matchMedia("(min-width: 960px)");
    const onMq = () => {
      if (mq.matches) setMenuOpen(false);
    };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else mq.addListener(onMq);
  }

  /* Active nav link */
  const sections = document.querySelectorAll("section[id]");
  const desktopLinks = document.querySelectorAll(".nav__link");

  function updateActiveNav() {
    const y = window.scrollY + 120;
    let current = "";
    sections.forEach((section) => {
      if (y >= section.offsetTop && y < section.offsetTop + section.offsetHeight) {
        current = section.id;
      }
    });
    desktopLinks.forEach((link) => {
      const href = link.getAttribute("href") || "";
      link.classList.toggle("is-active", href === "#" + current);
    });
  }
  window.addEventListener("scroll", updateActiveNav, { passive: true });
  updateActiveNav();

  /* Scroll reveal with stagger within groups */
  const revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else if ("IntersectionObserver" in window) {
    // Assign stagger indices per parent group
    const groups = new Map();
    revealEls.forEach((el) => {
      const parent = el.parentElement;
      const n = (groups.get(parent) || 0) + 1;
      groups.set(parent, n);
      el.setAttribute("data-i", String(Math.min(n, 6)));
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* Product slider */
  (function initProductSlider() {
    const root = document.getElementById("productSlider");
    if (!root) return;

    const slides = Array.from(root.querySelectorAll(".pslide"));
    const thumbs = Array.from(root.querySelectorAll(".pslide-thumb"));
    const prevBtn = document.getElementById("pslidePrev");
    const nextBtn = document.getElementById("pslideNext");
    const dotsWrap = document.getElementById("productDots");
    const progress = document.getElementById("productProgress");
    const total = slides.length;
    if (!total) return;

    let index = 0;
    let timer = null;
    const DURATION = reduceMotion ? 0 : 5500;
    root.style.setProperty("--pslide-duration", DURATION + "ms");

    // Build dots
    if (dotsWrap) {
      dotsWrap.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "pslide-dot" + (i === 0 ? " is-active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Slide " + (i + 1));
        dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
        dot.addEventListener("click", () => goTo(i, true));
        dotsWrap.appendChild(dot);
      }
    }

    const dots = dotsWrap
      ? Array.from(dotsWrap.querySelectorAll(".pslide-dot"))
      : [];

    function setProgressRunning(on) {
      if (!progress || reduceMotion) return;
      progress.classList.remove("is-running");
      // restart animation
      void progress.offsetWidth;
      if (on) progress.classList.add("is-running");
    }

    function goTo(next, userInitiated) {
      if (next === index) {
        if (userInitiated) restartAutoplay();
        return;
      }
      const prev = index;
      index = (next + total) % total;

      slides[prev].classList.remove("is-active");
      slides[prev].classList.add("is-exit");
      slides[prev].setAttribute("aria-hidden", "true");

      slides[index].classList.remove("is-exit");
      slides[index].classList.add("is-active");
      slides[index].setAttribute("aria-hidden", "false");

      window.setTimeout(() => {
        slides[prev].classList.remove("is-exit");
      }, 420);

      dots.forEach((d, i) => {
        d.classList.toggle("is-active", i === index);
        d.setAttribute("aria-selected", i === index ? "true" : "false");
      });

      thumbs.forEach((t, i) => {
        const on = i === index;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });

      // Keep active thumb in view
      const activeThumb = thumbs[index];
      if (activeThumb && activeThumb.scrollIntoView) {
        activeThumb.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          inline: "center",
          block: "nearest",
        });
      }

      restartAutoplay();
    }

    function next() {
      goTo(index + 1, false);
    }
    function prev() {
      goTo(index - 1, false);
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
      setProgressRunning(false);
    }

    function restartAutoplay() {
      stopAutoplay();
      if (reduceMotion || DURATION <= 0) return;
      setProgressRunning(true);
      timer = window.setInterval(next, DURATION);
    }

    prevBtn?.addEventListener("click", () => {
      prev();
    });
    nextBtn?.addEventListener("click", () => {
      next();
    });

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const g = Number(thumb.getAttribute("data-goto"));
        if (!Number.isNaN(g)) goTo(g, true);
      });
    });

    // Pause on hover / focus (desktop)
    root.addEventListener("mouseenter", stopAutoplay);
    root.addEventListener("mouseleave", restartAutoplay);
    root.addEventListener("focusin", stopAutoplay);
    root.addEventListener("focusout", (e) => {
      if (!root.contains(e.relatedTarget)) restartAutoplay();
    });

    // Touch swipe
    let touchX = null;
    root.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].clientX;
        stopAutoplay();
      },
      { passive: true }
    );
    root.addEventListener(
      "touchend",
      (e) => {
        if (touchX == null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 40) {
          if (dx < 0) next();
          else prev();
        } else {
          restartAutoplay();
        }
      },
      { passive: true }
    );

    // Keyboard when focused inside
    root.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    });
    root.setAttribute("tabindex", "0");

    // Pause when off-screen
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) restartAutoplay();
            else stopAutoplay();
          });
        },
        { threshold: 0.35 }
      );
      io.observe(root);
    } else {
      restartAutoplay();
    }
  })();

  /* Photo gallery — 4×4 collage pages, swipe for more */
  (function initPhotoGallery() {
    const collage = document.getElementById("galleryCollage");
    const track = document.getElementById("galleryTrack");
    const pager = document.getElementById("galleryPager");
    const dotsWrap = document.getElementById("galleryDots");
    const prevBtn = document.getElementById("galleryPrev");
    const nextBtn = document.getElementById("galleryNext");
    const modal = document.getElementById("imgModal");
    const modalImg = document.getElementById("imgModalImg");
    if (!collage || !track || !modal || !modalImg) return;

    const PER_PAGE = 16; // 4×4
    let items = [];
    let page = 0;
    let pageCount = 1;
    let lightboxIndex = 0;
    let lastFocus = null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function openLightbox(i) {
      if (!items.length) return;
      lightboxIndex = (i + items.length) % items.length;
      const item = items[lightboxIndex];
      modalImg.src = item.src;
      modalImg.alt = item.alt || "";
      lastFocus = document.activeElement;
      modal.hidden = false;
      void modal.offsetWidth;
      modal.classList.add("is-open");
      document.body.classList.add("menu-open");
      modal.querySelector(".img-modal__close")?.focus();
    }

    function closeLightbox() {
      modal.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      window.setTimeout(() => {
        if (!modal.classList.contains("is-open")) {
          modal.hidden = true;
          modalImg.src = "";
        }
      }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    function updateChrome() {
      if (pager) pager.textContent = page + 1 + " / " + pageCount;
      if (prevBtn) prevBtn.disabled = page <= 0;
      if (nextBtn) nextBtn.disabled = page >= pageCount - 1;
      if (dotsWrap) {
        dotsWrap.querySelectorAll(".gallery-collage__dot").forEach((d, i) => {
          d.classList.toggle("is-active", i === page);
          d.setAttribute("aria-selected", i === page ? "true" : "false");
        });
      }
      track.style.transform = "translateX(-" + page * 100 + "%)";
    }

    function goToPage(n) {
      page = Math.max(0, Math.min(pageCount - 1, n));
      updateChrome();
    }

    function render(list) {
      items = list.map((entry) => ({
        src: "assets/images/gallery/" + entry.file,
        alt: entry.alt || "Himudo",
      }));

      pageCount = Math.max(1, Math.ceil(items.length / PER_PAGE));
      page = 0;
      track.innerHTML = "";
      if (dotsWrap) dotsWrap.innerHTML = "";

      for (let p = 0; p < pageCount; p++) {
        const pageEl = document.createElement("div");
        pageEl.className = "gallery-collage__page";
        pageEl.setAttribute("role", "group");
        pageEl.setAttribute("aria-label", "Halaman " + (p + 1));

        const grid = document.createElement("div");
        grid.className = "gallery-collage__grid";

        for (let c = 0; c < PER_PAGE; c++) {
          const globalIndex = p * PER_PAGE + c;
          const cell = document.createElement("button");
          cell.type = "button";

          if (globalIndex < items.length) {
            const item = items[globalIndex];
            cell.className = "gallery-collage__cell";
            cell.setAttribute("aria-label", "Perbesar foto " + (globalIndex + 1));
            const img = document.createElement("img");
            img.src = item.src;
            img.alt = item.alt;
            img.loading = p === 0 ? "eager" : "lazy";
            img.decoding = "async";
            cell.appendChild(img);
            cell.addEventListener("click", () => openLightbox(globalIndex));
          } else {
            cell.className = "gallery-collage__cell is-empty";
            cell.tabIndex = -1;
            cell.setAttribute("aria-hidden", "true");
            cell.disabled = true;
          }

          grid.appendChild(cell);
        }

        pageEl.appendChild(grid);
        track.appendChild(pageEl);

        if (dotsWrap && pageCount > 1) {
          const dot = document.createElement("button");
          dot.type = "button";
          dot.className = "gallery-collage__dot" + (p === 0 ? " is-active" : "");
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "Halaman " + (p + 1));
          dot.setAttribute("aria-selected", p === 0 ? "true" : "false");
          dot.addEventListener("click", () => goToPage(p));
          dotsWrap.appendChild(dot);
        }
      }

      if (dotsWrap) {
        dotsWrap.hidden = pageCount <= 1;
      }
      updateChrome();
    }

    prevBtn?.addEventListener("click", () => goToPage(page - 1));
    nextBtn?.addEventListener("click", () => goToPage(page + 1));

    // Swipe pages on collage viewport
    const viewport = collage.querySelector(".gallery-collage__viewport");
    let touchX = null;
    let touchY = null;
    let swiping = false;

    if (viewport) {
      viewport.addEventListener(
        "touchstart",
        (e) => {
          touchX = e.changedTouches[0].clientX;
          touchY = e.changedTouches[0].clientY;
          swiping = true;
        },
        { passive: true }
      );
      viewport.addEventListener(
        "touchend",
        (e) => {
          if (!swiping || touchX == null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          const dy = e.changedTouches[0].clientY - touchY;
          touchX = null;
          touchY = null;
          swiping = false;
          if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
          if (dx < 0) goToPage(page + 1);
          else goToPage(page - 1);
        },
        { passive: true }
      );
    }

    // Keyboard when collage focused
    collage.addEventListener("keydown", (e) => {
      if (modal.classList.contains("is-open")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToPage(page + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPage(page - 1);
      }
    });

    // Lightbox controls
    modal.querySelectorAll("[data-close-img]").forEach((el) => {
      el.addEventListener("click", closeLightbox);
    });
    document.getElementById("imgPrev")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(lightboxIndex - 1);
    });
    document.getElementById("imgNext")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openLightbox(lightboxIndex + 1);
    });

    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") openLightbox(lightboxIndex - 1);
      if (e.key === "ArrowRight") openLightbox(lightboxIndex + 1);
    });

    let lbTouchX = null;
    modalImg.addEventListener(
      "touchstart",
      (e) => {
        lbTouchX = e.changedTouches[0].clientX;
      },
      { passive: true }
    );
    modalImg.addEventListener(
      "touchend",
      (e) => {
        if (lbTouchX == null) return;
        const dx = e.changedTouches[0].clientX - lbTouchX;
        lbTouchX = null;
        if (Math.abs(dx) > 40) {
          if (dx < 0) openLightbox(lightboxIndex + 1);
          else openLightbox(lightboxIndex - 1);
        }
      },
      { passive: true }
    );

    if (reduce) {
      track.style.transition = "none";
    }

    fetch("assets/images/gallery/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list = Array.isArray(data?.images) ? data.images : [];
        if (list.length) render(list);
        else {
          track.innerHTML =
            '<p class="gallery__credit" style="padding:2rem">Belum ada foto di folder gallery.</p>';
        }
      })
      .catch(() => {
        track.innerHTML =
          '<p class="gallery__credit" style="padding:2rem">Gagal memuat galeri.</p>';
      });
  })();

  /* Video gallery modal */
  (function initVideoGallery() {
    const modal = document.getElementById("videoModal");
    const frame = document.getElementById("videoModalFrame");
    if (!modal || !frame) return;

    let lastFocus = null;

    function openModal(type, idOrSrc, title) {
      lastFocus = document.activeElement;
      frame.innerHTML = "";

      if (type === "youtube") {
        const iframe = document.createElement("iframe");
        iframe.src =
          "https://www.youtube-nocookie.com/embed/" +
          encodeURIComponent(idOrSrc) +
          "?autoplay=1&rel=0&modestbranding=1";
        iframe.title = title || "Video Himudo";
        iframe.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.loading = "eager";
        frame.appendChild(iframe);
      } else if (type === "file") {
        const video = document.createElement("video");
        video.src = idOrSrc;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.title = title || "Video Himudo";
        frame.appendChild(video);
      } else {
        return;
      }

      modal.hidden = false;
      void modal.offsetWidth;
      modal.classList.add("is-open");
      document.body.classList.add("menu-open");
      modal.querySelector(".video-modal__close")?.focus();
    }

    function closeModal() {
      modal.classList.remove("is-open");
      document.body.classList.remove("menu-open");
      window.setTimeout(() => {
        if (!modal.classList.contains("is-open")) {
          frame.innerHTML = "";
          modal.hidden = true;
        }
      }, 280);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.querySelectorAll(".video-card[data-video-type]").forEach((card) => {
      const btn = card.querySelector(".video-card__play");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const type = card.getAttribute("data-video-type");
        const id = card.getAttribute("data-video-id");
        const src = card.getAttribute("data-video-src");
        const title =
          card.querySelector("h3")?.textContent?.trim() || "Video Himudo";
        if (type === "youtube" && id) openModal("youtube", id, title);
        else if (type === "file" && src) openModal("file", src, title);
      });
    });

    modal.querySelectorAll("[data-close-video]").forEach((el) => {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) {
        closeModal();
      }
    });

    // Optional: inject local files listed in assets/videos/manifest.json
    // Create that file with: [{ "file": "promo.mp4", "title": "...", "desc": "..." }]
    fetch("assets/videos/manifest.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((list) => {
        if (!Array.isArray(list) || !list.length) return;
        const grid = document.querySelector(".videos__grid");
        if (!grid) return;

        list.forEach((item) => {
          if (!item || !item.file) return;
          const src = "assets/videos/" + String(item.file).replace(/^\/+/, "");
          const title = item.title || item.file;
          const desc = item.desc || "Video lokal Himudo";

          const article = document.createElement("article");
          article.className = "video-card reveal is-in";
          article.setAttribute("data-video-type", "file");
          article.setAttribute("data-video-src", src);
          article.innerHTML =
            '<button type="button" class="video-card__play" aria-label="Putar ' +
            title.replace(/"/g, "&quot;") +
            '">' +
            '<span class="video-card__thumb video-card__thumb--local">' +
            '<span class="video-card__icon" aria-hidden="true">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>' +
            "</span></span>" +
            '<span class="video-card__meta">' +
            '<span class="video-card__tag">Lokal</span>' +
            "<h3></h3><p></p></span></button>";

          article.querySelector("h3").textContent = title;
          article.querySelector("p").textContent = desc;

          article.querySelector(".video-card__play").addEventListener("click", () => {
            openModal("file", src, title);
          });

          grid.appendChild(article);
        });
      })
      .catch(() => {
        /* no local manifest */
      });
  })();

  /* Contact → WhatsApp */
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = (document.getElementById("name")?.value || "").trim();
      const phone = (document.getElementById("phone")?.value || "").trim();
      const email = (document.getElementById("email")?.value || "").trim();
      const subject = (document.getElementById("subject")?.value || "").trim();
      const message = (document.getElementById("message")?.value || "").trim();

      if (!name || !phone || !message) {
        alert("Mohon lengkapi nama, nomor WhatsApp, dan pesan Anda.");
        return;
      }

      const text = [
        "Halo Himudo!",
        "",
        "*Nama:* " + name,
        "*WhatsApp:* " + phone,
        email ? "*Email:* " + email : null,
        "*Subjek:* " + subject,
        "",
        "*Pesan:*",
        message,
      ]
        .filter(Boolean)
        .join("\n");

      const url =
        "https://api.whatsapp.com/send?phone=6282168836677&text=" +
        encodeURIComponent(text);
      window.open(url, "_blank", "noopener,noreferrer");
    });
  }
})();
