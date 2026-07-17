/* ==========================================================================
   MAIN CHARACTER — animations.js
   GSAP + ScrollTrigger motion layer.

   Contract with CSS: elements carrying [data-reveal] are hidden by
   assets/css/main.css, but ONLY while <html> has the .is-ready class. We add
   that class here — so if GSAP fails to load, nothing is ever hidden and the
   page degrades to a plain (but complete) document.
   ========================================================================== */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function start() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    if (reduceMotion) return; // CSS already revealed everything

    gsap.registerPlugin(ScrollTrigger);
    document.documentElement.classList.add("is-ready");

    // Fonts must be loaded before we measure line boxes, or the split is wrong.
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    fontsReady.then(build);
  }

  function build() {
    splitHeadlines();
    revealElements();
    parallaxLayers();
    floatOrbs();
    countUp();
    timelines();
    horizontalStrips();
    meters();
    testimonialLoop();

    ScrollTrigger.refresh();
  }

  /* ------------------------------------------------------------------------
     TESTIMONIAL LOOP
     Never-ending marquee. The card set is cloned once, then the track is moved
     to xPercent -50 on repeat — at which point the clone sits exactly where
     the original started, so the seam is invisible.

     The clones are aria-hidden and taken out of the tab order: without that,
     a screen reader reads all five testimonials twice and every card is
     tabbable twice.
     ---------------------------------------------------------------------- */
  function testimonialLoop() {
    $$("[data-tloop]").forEach((track) => {
      const originals = Array.from(track.children);
      if (!originals.length) return;

      originals.forEach((card) => {
        const clone = card.cloneNode(true);
        clone.setAttribute("aria-hidden", "true");
        clone.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
        track.appendChild(clone);
      });

      // Constant speed regardless of card count, so adding a testimonial later
      // doesn't silently speed the whole thing up.
      const distance = track.scrollWidth / 2;
      const speed = 55; // px per second
      const tl = gsap.to(track, {
        xPercent: -50,
        duration: distance / speed,
        ease: "none",
        repeat: -1,
      });

      const viewport = track.closest(".tloop") || track.parentElement;
      viewport.addEventListener("mouseenter", () => gsap.to(tl, { timeScale: 0, duration: 0.4 }));
      viewport.addEventListener("mouseleave", () => gsap.to(tl, { timeScale: 1, duration: 0.4 }));

      // Keyboard users get the same courtesy as hover.
      viewport.addEventListener("focusin", () => tl.pause());
      viewport.addEventListener("focusout", () => tl.play());

      // Don't burn a RAF on a marquee nobody is looking at.
      ScrollTrigger.create({
        trigger: viewport,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
      });
    });
  }

  /* ------------------------------------------------------------------------
     SPLIT TEXT
     A line-splitter that survives inline <em> accents. We wrap every word in a
     probe span, read its offsetTop to group words into visual lines, then
     rebuild the element as masked lines. Accent words are re-created as <em>
     so the gold italic styling carries through.
     ---------------------------------------------------------------------- */
  function splitHeadlines() {
    $$('[data-split="lines"]').forEach((el) => {
      const lines = measureLines(el);
      if (!lines.length) return;

      rebuildAsLines(el, lines);

      const inners = $$(".line-inner", el);
      gsap.set(inners, { yPercent: 118 });

      const tween = gsap.to(inners, {
        yPercent: 0,
        duration: 1.15,
        ease: "power4.out",
        stagger: 0.085,
        paused: true,
        // Release the masks once revealed so a later reflow (resize, rotate)
        // can never clip the text.
        onComplete: () => $$(".line-mask", el).forEach((m) => (m.style.overflow = "visible")),
      });

      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        tween.play();
      }, { rootMargin: "0px 0px -12% 0px", threshold: 0 });
      io.observe(el);
    });
  }

  function measureLines(el) {
    const words = [];
    const textNodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) textNodes.push(walker.currentNode);

    // Whether the *source* had whitespace before the next word. Tracked across
    // text-node boundaries, because `<em>hoort</em>.` is two adjacent nodes
    // with no space between them — rejoining those with " " would render
    // "hoort ." on every accent-terminated headline.
    let spaceBefore = false;

    textNodes.forEach((node) => {
      if (!node.textContent.trim()) {
        // A node of pure whitespace still separates the words either side.
        if (node.textContent.length) spaceBefore = true;
        return;
      }
      const isAccent = !!node.parentElement.closest("em, .accent");
      const frag = document.createDocumentFragment();

      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (!part.trim()) {
          spaceBefore = true;
          frag.appendChild(document.createTextNode(part));
          return;
        }
        const span = document.createElement("span");
        span.style.display = "inline-block";
        span.textContent = part;
        span.__accent = isAccent;
        span.__spaceBefore = spaceBefore;
        spaceBefore = false;
        frag.appendChild(span);
        words.push(span);
      });

      node.parentNode.replaceChild(frag, node);
    });

    // Group by vertical position. 4px tolerance absorbs sub-pixel jitter.
    const lines = [];
    let current = null;
    let lastTop = null;

    words.forEach((word) => {
      const top = word.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) {
        current = [];
        lines.push(current);
        lastTop = top;
      }
      current.push({
        text: word.textContent,
        accent: word.__accent,
        spaceBefore: word.__spaceBefore,
      });
    });

    return lines;
  }

  function rebuildAsLines(el, lines) {
    el.textContent = "";

    lines.forEach((words) => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      const inner = document.createElement("span");
      inner.className = "line-inner";

      words.forEach((word, i) => {
        // Re-insert a space only where the source actually had one, and never
        // at the start of a line.
        if (i > 0 && word.spaceBefore) {
          inner.appendChild(document.createTextNode(" "));
        }
        if (word.accent) {
          const em = document.createElement("em");
          em.textContent = word.text;
          inner.appendChild(em);
        } else {
          inner.appendChild(document.createTextNode(word.text));
        }
      });

      mask.appendChild(inner);
      el.appendChild(mask);
    });
  }

  /* ------------------------------------------------------------------------
     SCROLL REVEAL
     One IntersectionObserver for every reveal on the page, instead of one
     ScrollTrigger per element.

     ScrollTrigger is superb at scrubbing, but each instance measures its
     trigger's geometry and re-measures on refresh. ~40 of them for
     fire-once reveals put Style & Layout at 987ms and Total Blocking Time at
     230ms. Reveals never scrub — they fire once on enter — which is exactly
     what IntersectionObserver does, off the main thread, for free.
     ScrollTrigger is still used below for the things that genuinely scrub:
     parallax, the timeline progress bar, and the gallery drift.

     Groups marked [data-stagger] are observed as one unit so they read as a
     single gesture rather than N independent ones.
     ---------------------------------------------------------------------- */
  function revealElements() {
    const singles = $$("[data-reveal]").filter((el) => !el.closest("[data-stagger]"));
    const groups = $$("[data-stagger]").filter((g) => $$("[data-reveal]", g).length);
    if (!singles.length && !groups.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target;
          io.unobserve(el); // fire once

          const isGroup = el.hasAttribute("data-stagger");
          const targets = isGroup ? $$("[data-reveal]", el) : el;

          gsap.to(targets, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: isGroup ? 0.9 : 1,
            ease: "power3.out",
            stagger: isGroup ? 0.08 : 0,
            delay: isGroup ? 0 : parseFloat(el.dataset.revealDelay) || 0,
            overwrite: "auto",
          });
        }
      },
      // -10% bottom margin ≈ ScrollTrigger's old "top 90%" start.
      { rootMargin: "0px 0px -10% 0px", threshold: 0 }
    );

    singles.forEach((el) => io.observe(el));
    groups.forEach((g) => io.observe(g));
  }

  /* ------------------------------------------------------------------------
     PARALLAX
     ---------------------------------------------------------------------- */
  function parallaxLayers() {
    $$("[data-parallax]").forEach((el) => {
      const strength = parseFloat(el.dataset.parallax) || 0.1;

      gsap.fromTo(
        el,
        { yPercent: -strength * 50 },
        {
          yPercent: strength * 50,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement || el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    });
  }

  function floatOrbs() {
    $$("[data-float]").forEach((orb, i) => {
      const dir = orb.dataset.float === "2" ? -1 : 1;

      gsap.to(orb, {
        y: dir * 60,
        x: dir * 34,
        duration: 9 + i * 2.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Slow drift against the scroll adds depth without reading as parallax.
      gsap.to(orb, {
        yPercent: 26 * dir,
        ease: "none",
        scrollTrigger: { trigger: orb.parentElement, start: "top bottom", end: "bottom top", scrub: 1.4 },
      });
    });
  }

  /* ------------------------------------------------------------------------
     ANIMATED COUNTERS
     ---------------------------------------------------------------------- */
  function countUp() {
    $$("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.countSuffix || "";
      const proxy = { value: 0 };

      // Fire-once like the reveals — an IntersectionObserver, not a
      // ScrollTrigger. Counters never scrub.
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        gsap.to(proxy, {
          value: target,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = Math.round(proxy.value).toLocaleString("nl-NL") + suffix;
          },
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     TIMELINE — gold progress line + node activation
     ---------------------------------------------------------------------- */
  function timelines() {
    $$(".timeline").forEach((timeline) => {
      const bar = $("[data-timeline-progress]", timeline);

      if (bar) {
        gsap.fromTo(
          bar,
          { height: "0%" },
          {
            height: "100%",
            ease: "none",
            scrollTrigger: {
              trigger: timeline,
              start: "top 65%",
              end: "bottom 75%",
              scrub: 0.6,
            },
          }
        );
      }

      $$("[data-timeline-item]", timeline).forEach((item) => {
        ScrollTrigger.create({
          trigger: item,
          start: "top 70%",
          end: "bottom 60%",
          onEnter:     () => item.classList.add("is-active"),
          onEnterBack: () => item.classList.add("is-active"),
        });
      });
    });
  }

  /* ------------------------------------------------------------------------
     HORIZONTAL STRIPS — gallery drift on vertical scroll
     ---------------------------------------------------------------------- */
  function horizontalStrips() {
    $$("[data-marquee-scroll]").forEach((strip) => {
      const shift = parseFloat(strip.dataset.marqueeScroll) || -10;

      gsap.fromTo(
        strip,
        { xPercent: 0 },
        {
          xPercent: shift,
          ease: "none",
          scrollTrigger: {
            trigger: strip,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    });
  }

  /* ------------------------------------------------------------------------
     SEAT METERS
     ---------------------------------------------------------------------- */
  function meters() {
    $$("[data-meter]").forEach((el) => {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        gsap.to(el, {
          width: (parseFloat(el.dataset.meter) || 0) + "%",
          duration: 1.6,
          ease: "power3.out",
        });
      }, { threshold: 0 });
      io.observe(el);
    });
  }

  /* ------------------------------------------------------------------------
     BOOT
     main.js fires mc:ready once the core is wired — but it may already have
     fired before this file executed (both are `defer`, and main.js boots
     synchronously when readyState is "interactive"). So check the flag first
     and only subscribe if we're genuinely early.
     ---------------------------------------------------------------------- */
  if (window.mcReady) {
    start();
  } else {
    document.addEventListener("mc:ready", start, { once: true });
  }
})();
