/* ==========================================================================
   MAIN CHARACTER — main.js
   Core behaviour: loader, smooth scroll, one-page nav + scrollspy, mobile
   menu, Vimeo hero, countdown, accordion, carousel, video modal, analytics.

   Animation (GSAP/ScrollTrigger) lives in animations.js and boots from the
   `mc:ready` event dispatched at the bottom of this file.
   ========================================================================== */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NAV_OFFSET = -80; // clears the fixed nav

  /* ------------------------------------------------------------------------
     LOADER
     The CSS keyframe already guarantees the loader clears itself, even with
     no JS at all (see main.css §21). All this does is dismiss it sooner on
     the happy path. It must never be the only thing that can hide it.
     ---------------------------------------------------------------------- */
  function initLoader() {
    const loader = $("#loader");
    if (!loader) return;
    let done = false;

    const dismiss = () => {
      if (done) return;
      done = true;
      loader.classList.add("is-done");
      // Only remove after the fade; removing mid-transition causes a flash.
      setTimeout(() => loader.remove(), 500);
    };

    // Fonts are the thing worth waiting for — they cause the visible reflow.
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(() =>
      requestAnimationFrame(dismiss)
    );
    window.addEventListener("load", dismiss);
    setTimeout(dismiss, 2000); // belt and braces
  }

  /* ------------------------------------------------------------------------
     LENIS SMOOTH SCROLL
     ---------------------------------------------------------------------- */
  let lenis = null;

  function initLenis() {
    if (reduceMotion || typeof Lenis === "undefined") return;

    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);
    window.mcLenis = lenis;
  }

  function scrollToTarget(target) {
    if (lenis) {
      // Re-measure before every jump. Anything that has put `overflow: hidden`
      // on the page (the mobile menu's scroll lock, a modal) collapses the
      // document height while it's up, and Lenis caches that as a scroll limit
      // of 0 — every later scrollTo then silently clamps to the top.
      lenis.resize();
      lenis.scrollTo(target, { offset: NAV_OFFSET, duration: 1.3 });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY + NAV_OFFSET;
      window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  /* ------------------------------------------------------------------------
     ONE-PAGE ANCHORS
     ---------------------------------------------------------------------- */
  function initAnchors() {
    $$('a[href^="#"]').forEach((link) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;

      link.addEventListener("click", (e) => {
        const target = $(id);
        if (!target) return;
        e.preventDefault();
        closeMenu();
        // Let the menu's clip-path start before we scroll, or the two fight.
        setTimeout(() => scrollToTarget(target), link.closest(".mobile-menu") ? 260 : 0);
        history.replaceState(null, "", id);
      });
    });
  }

  /* ------------------------------------------------------------------------
     SCROLLSPY
     Marks the section currently under the nav. Uses a scroll listener rather
     than IntersectionObserver: sections here vary wildly in height, and IO
     thresholds pick the wrong one when a short section follows a tall one.
     ---------------------------------------------------------------------- */
  function initScrollSpy() {
    const links = $$("[data-spy]");
    if (!links.length) return;

    const targets = links
      .map((link) => {
        const id = link.getAttribute("href");
        const section = $(id);
        return section ? { link, section, id } : null;
      })
      .filter(Boolean);
    if (!targets.length) return;

    let current = null;

    const update = () => {
      const line = window.scrollY - NAV_OFFSET + 8; // the nav's underside
      let active = null;

      for (const t of targets) {
        if (t.section.offsetTop <= line) active = t;
      }
      // Past the bottom: pin the last one so nothing is left unhighlighted.
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
        active = targets[targets.length - 1];
      }

      const id = active ? active.id : null;
      if (id === current) return;
      current = id;

      links.forEach((l) => l.classList.toggle("is-active", !!id && l.getAttribute("href") === id));
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------------
     NAV
     ---------------------------------------------------------------------- */
  function initNav() {
    const nav = $("#nav");
    if (!nav) return;
    let last = 0;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("nav--scrolled", y > 40);
      // The nav must stay put while the menu is open, and never hide upward.
      const menuOpen = nav.dataset.menuOpen === "true";
      nav.classList.toggle("nav--hidden", !menuOpen && y > 700 && y > last);
      last = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------------
     MOBILE MENU
     ---------------------------------------------------------------------- */
  const menu = () => $("#mobileMenu");
  const burger = () => $("#burger");

  function openMenu() {
    const m = menu(), b = burger(), nav = $("#nav");
    if (!m) return;
    m.classList.add("is-open");
    nav.dataset.menuOpen = "true";
    nav.classList.remove("nav--hidden");
    b.setAttribute("aria-expanded", "true");
    b.setAttribute("aria-label", "Menu sluiten");
    // Lenis already halts scrolling; adding a body-level overflow lock on top
    // is redundant and collapses the document height it measures against.
    // Only reach for the CSS lock when Lenis isn't driving.
    if (lenis) lenis.stop();
    else document.body.classList.add("menu-locked");
    // Move focus in so the panel is keyboard-navigable immediately.
    const first = $(".mobile-menu-link", m);
    first && setTimeout(() => first.focus({ preventScroll: true }), 320);
  }

  function closeMenu() {
    const m = menu(), b = burger(), nav = $("#nav");
    if (!m || !m.classList.contains("is-open")) return;
    m.classList.remove("is-open");
    nav.dataset.menuOpen = "false";
    b.setAttribute("aria-expanded", "false");
    b.setAttribute("aria-label", "Menu openen");
    document.body.classList.remove("menu-locked");
    if (lenis) {
      lenis.start();
      lenis.resize(); // the lock is gone — re-read the real document height
    }
  }

  function initMenu() {
    const b = burger(), m = menu();
    if (!b || !m) return;

    b.addEventListener("click", () =>
      m.classList.contains("is-open") ? closeMenu() : openMenu()
    );

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || !m.classList.contains("is-open")) return;
      closeMenu();
      b.focus();
    });

    // Focus trap while open.
    m.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !m.classList.contains("is-open")) return;
      const items = $$('a[href], button', m).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    // A resize past the lg breakpoint must not leave a locked body behind.
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) closeMenu();
    });
  }

  /* ------------------------------------------------------------------------
     VIMEO HERO
     The iframe is injected only when the visitor presses play (or when
     autoplay is attempted), so the player bundle never blocks the LCP.
     ---------------------------------------------------------------------- */
  function initVimeo() {
    const frame = $("#heroVideo");
    const poster = $("#heroPoster");
    if (!frame || !poster) return;

    const id = frame.dataset.vimeo;
    const sound = $("#heroSound");
    let mode = null; // null | "ambient" | "sound"

    // Two modes, both looping:
    //   ambient — muted, no controls, autoplays when the hero is on screen.
    //             This is the default state, so the page is muted by default.
    //   sound   — the visitor pressed play, so they get audio AND controls.
    //             Controls are "specifically required" here: it's a 1:52 film
    //             and someone watching it with sound needs to pause or scrub.
    // loop=1 in both: the film restarts instead of ending on Vimeo's black
    // end-screen with a replay button.
    function mount({ autoplay, muted }) {
      const next = muted ? "ambient" : "sound";
      if (mode === next) return;

      // Switching modes means a new iframe: Vimeo bakes muted/controls into
      // the embed URL, so the old one has to go. Without this, the ambient
      // mount would win the race and the play button would do nothing —
      // leaving a silent film with no way to ever hear it.
      const existing = frame.querySelector("iframe");
      if (existing) existing.remove();
      mode = next;

      const params = new URLSearchParams({
        autoplay: autoplay ? "1" : "0",
        muted: muted ? "1" : "0",
        loop: "1",
        controls: muted ? "0" : "1",
        playsinline: "1",
        title: "0",
        byline: "0",
        portrait: "0",
        transparent: "0",
        dnt: "1", // don't let Vimeo track the visitor
      });

      const iframe = document.createElement("iframe");
      iframe.src = `https://player.vimeo.com/video/${id}?${params}`;
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.title = "MAIN CHARACTER Storytelling";
      iframe.loading = "lazy";
      frame.insertBefore(iframe, poster);

      // Only reveal the player once Vimeo says it is genuinely PLAYING.
      //
      // Not on iframe `load`: an error page fires load too. Vimeo currently
      // answers 401 for this video on every domain (its embed permission is
      // off), and revealing on load would replace our poster with Vimeo's
      // error screen on the live site. Waiting for a real `play` event means
      // a blocked embed simply leaves the poster up — the hero still looks
      // finished, and the play button still works as a link to the film.
      const reveal = () => {
        frame.classList.add("is-playing");
        // Muted by default, so it needs a route back to sound. This is the
        // only affordance for it once the poster is gone.
        if (sound) sound.hidden = mode !== "ambient";
      };

      function onMessage(e) {
        if (!/^https:\/\/player\.vimeo\.com/.test(e.origin)) return;
        let d;
        try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
        if (!d || !d.event) return;

        if (d.event === "ready") {
          // Subscribe to play; the player only emits events we ask for.
          iframe.contentWindow.postMessage(
            JSON.stringify({ method: "addEventListener", value: "play" }), "*"
          );
        } else if (d.event === "play") {
          window.removeEventListener("message", onMessage);
          reveal();
        }
      }
      window.addEventListener("message", onMessage);
    }

    // FACADE — the player mounts on click, never on scroll.
    //
    // Vimeo's embed drags in ~340KB of third-party JS (player.module 217KB,
    // vendor.module 93KB, plus Google Cast) and sets third-party cookies.
    // Mounting it automatically spent all of that on every visit and put Total
    // Blocking Time at 260ms — the single thing holding the page under 90.
    //
    // The poster IS the facade: our own AVIF, with the play button on it. It
    // looks identical until someone actually wants the film, and the film then
    // autoplays with sound the moment it is asked for.
    //
    // The trade-off, stated plainly: no muted ambient autoplay on scroll. On a
    // page we pay Meta to fill, a 340KB tax on every visitor buys very little.
    const play = () => mount({ autoplay: true, muted: false });
    poster.addEventListener("click", play);
    sound &&
      sound.addEventListener("click", () => {
        play();
        sound.hidden = true;
      });

    // Warm the connection on hover so the click still feels instant. A
    // preconnect costs a handshake, not 340KB.
    poster.addEventListener("pointerenter", () => {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = "https://player.vimeo.com";
      document.head.appendChild(l);
    }, { once: true });
  }

  /* ------------------------------------------------------------------------
     COUNTDOWN
     Renders each digit in its own rolling slot, and only re-renders the
     digits that actually changed — so "07 → 08" moves one digit, not four.
     ---------------------------------------------------------------------- */
  function initCountdown() {
    const root = $("#countdown");
    if (!root) return;

    const deadline = new Date(root.dataset.deadline).getTime();
    if (Number.isNaN(deadline)) return;

    const clocks = [root, ...$$("[data-deadline-mirror]")];
    const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

    function paint(el, value, animate) {
      const chars = String(value).split("");

      // Build the slots once, then only touch what changed.
      if (el.children.length !== chars.length) {
        el.textContent = "";
        chars.forEach((c) => {
          const slot = document.createElement("span");
          slot.className = "cd-digit";
          slot.innerHTML = `<b class="in">${c}</b>`;
          el.appendChild(slot);
        });
        return;
      }

      chars.forEach((c, i) => {
        const slot = el.children[i];
        const cur = slot.querySelector("b:not(.out)");
        if (!cur || cur.textContent === c) return;

        if (!animate) { cur.textContent = c; return; }

        cur.classList.add("out");
        const next = document.createElement("b");
        next.className = "in";
        next.textContent = c;
        slot.appendChild(next);
        // Drop the outgoing digit once its keyframe has finished.
        setTimeout(() => cur.remove(), 520);
      });
    }

    let first = true;

    function tick() {
      const diff = deadline - Date.now();

      if (diff <= 0) {
        clocks.forEach((clock) =>
          $$("[data-cd]", clock).forEach((el) => paint(el, "00", false))
        );
        const note = root.parentElement?.querySelector(".eyebrow");
        if (note) note.textContent = "De Deuren Zijn Open";
        return;
      }

      const s = Math.floor(diff / 1000);
      const values = {
        days: pad(Math.floor(s / 86400)),
        hours: pad(Math.floor((s % 86400) / 3600)),
        minutes: pad(Math.floor((s % 3600) / 60)),
        seconds: pad(s % 60),
      };

      clocks.forEach((clock) => {
        $$("[data-cd]", clock).forEach((el) => paint(el, values[el.dataset.cd], !first));
      });

      first = false;
      setTimeout(tick, 1000);
    }
    tick();
  }

  /* ------------------------------------------------------------------------
     ACCORDION
     ---------------------------------------------------------------------- */
  function initAccordion() {
    const items = $$(".acc-item");
    if (!items.length) return;

    function close(item) {
      const panel = $(".acc-panel", item);
      $(".acc-trigger", item).setAttribute("aria-expanded", "false");
      item.dataset.open = "false";
      if (window.gsap && !reduceMotion) gsap.to(panel, { height: 0, duration: 0.4, ease: "power2.inOut" });
      else panel.style.height = "0px";
    }

    function open(item) {
      const panel = $(".acc-panel", item);
      $(".acc-trigger", item).setAttribute("aria-expanded", "true");
      item.dataset.open = "true";
      if (window.gsap && !reduceMotion) {
        gsap.to(panel, {
          height: "auto",
          duration: 0.5,
          ease: "power3.out",
          onComplete: () => window.ScrollTrigger && ScrollTrigger.refresh(),
        });
      } else {
        panel.style.height = "auto";
      }
    }

    items.forEach((item) => {
      $(".acc-trigger", item).addEventListener("click", () => {
        const isOpen = item.dataset.open === "true";
        items.forEach((other) => other !== item && close(other));
        isOpen ? close(item) : open(item);
      });
    });
  }

  /* ------------------------------------------------------------------------
     CAROUSEL
     ---------------------------------------------------------------------- */
  function initCarousel() {
    $$("[data-carousel-next]").forEach((b) =>
      b.addEventListener("click", () => nudge(b.dataset.carouselNext, 1))
    );
    $$("[data-carousel-prev]").forEach((b) =>
      b.addEventListener("click", () => nudge(b.dataset.carouselPrev, -1))
    );

    function nudge(name, dir) {
      const track = $("#carousel-" + name);
      if (!track || !track.firstElementChild) return;
      const gap = parseFloat(getComputedStyle(track).gap) || 16;
      track.scrollBy({
        left: dir * (track.firstElementChild.getBoundingClientRect().width + gap),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }

  /* ------------------------------------------------------------------------
     VIDEO MODAL
     ---------------------------------------------------------------------- */
  function initVideoModal() {
    const modal = $("#videoModal");
    const video = $("#modalVideo");
    if (!modal || !video) return;

    $$("[data-video]").forEach((btn) => {
      btn.addEventListener("click", () => {
        video.src = btn.dataset.video;
        modal.showModal();
        lenis && lenis.stop();
        video.play().catch(() => {});
      });
    });

    function closeModal() {
      video.pause();
      video.removeAttribute("src");
      video.load();
      modal.open && modal.close();
      lenis && lenis.start();
    }

    $("[data-modal-close]", modal)?.addEventListener("click", closeModal);
    modal.addEventListener("close", () => { video.pause(); lenis && lenis.start(); });
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  }

  /* ------------------------------------------------------------------------
     STICKY MOBILE CTA
     ---------------------------------------------------------------------- */
  function initStickyCta() {
    const cta = $("#stickyCta");
    const hero = $("#hero");
    if (!cta || !hero || !("IntersectionObserver" in window)) return;

    new IntersectionObserver(
      ([entry]) => cta.classList.toggle("is-visible", !entry.isIntersecting),
      { threshold: 0, rootMargin: "-80% 0px 0px 0px" }
    ).observe(hero);
  }

  /* ------------------------------------------------------------------------
     CARD GLOW
     ---------------------------------------------------------------------- */
  function initCardGlow() {
    if (window.matchMedia("(hover: none)").matches) return;
    $$(".card-glow").forEach((card) => {
      card.addEventListener("mousemove", (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", e.clientX - r.left + "px");
        card.style.setProperty("--my", e.clientY - r.top + "px");
      });
    });
  }

  /* ------------------------------------------------------------------------
     ANALYTICS
     ---------------------------------------------------------------------- */
  function initAnalytics() {
    $$("[data-cta]").forEach((el) => {
      el.addEventListener("click", () => {
        const payload = { location: el.dataset.cta, value: 125, currency: "EUR" };
        window.fbq && fbq("track", "InitiateCheckout", payload);
        window.dataLayer && dataLayer.push({ event: "cta_click", ...payload });
      });
    });
  }

  /* ------------------------------------------------------------------------
     BOOT
     ---------------------------------------------------------------------- */
  function boot() {
    initLoader();
    initLenis();
    initAnchors();
    initScrollSpy();
    initNav();
    initMenu();
    initVimeo();
    initCountdown();
    initAccordion();
    initCarousel();
    initVideoModal();
    initStickyCta();
    initCardGlow();
    initAnalytics();

    // animations.js waits for this. The flag matters: both scripts are
    // `defer`, so boot() can run synchronously (readyState is already
    // "interactive") *before* animations.js has executed and subscribed —
    // the event would fire into the void. The flag lets a late subscriber
    // notice it already happened.
    window.mcReady = true;
    document.dispatchEvent(new CustomEvent("mc:ready", { detail: { lenis } }));
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();
})();
