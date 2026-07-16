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
