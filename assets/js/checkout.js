/* ==========================================================================
   MAIN CHARACTER — checkout.js

   ⚠️ PROTOTYPE ONLY — this file never touches money. It validates, updates the
   summary, and shows a confirmation dialog. The production build hands off to
   Plug&Pay; see README.md → "Wiring the checkout to Plug&Pay".
   ========================================================================== */
(function () {
  "use strict";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PRICE = { ticket: 125, bump: 27 };
  const euro = (n) =>
    "€" + n.toLocaleString("nl-NL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const form = $("#checkout-form");

  /* ------------------------------------------------------------------------
     VALIDATION
     Fields validate on blur, then live on input once touched — never while
     someone is still typing their first attempt.
     ---------------------------------------------------------------------- */
  const RULES = {
    firstName: (v) => v.trim().length >= 2,
    lastName:  (v) => v.trim().length >= 2,
    email:     (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
    // NL/BE mobile + landline, tolerant of spaces, dashes and +31/+32.
    phone:     (v) => /^[+]?[\d\s\-()]{9,17}$/.test(v.trim()),
  };

  function validateField(input) {
    const rule = RULES[input.name];
    if (!rule) return true;
    const ok = rule(input.value);
    input.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }

  function initValidation() {
    Object.keys(RULES).forEach((name) => {
      const input = form.elements[name];
      if (!input) return;

      input.addEventListener("blur", () => {
        input.dataset.touched = "1";
        validateField(input);
      });
      input.addEventListener("input", () => {
        if (input.dataset.touched) validateField(input);
      });
    });
  }

  /* ------------------------------------------------------------------------
     ORDER SUMMARY
     ---------------------------------------------------------------------- */
  const bump = $("#bump");

  function updateTotal() {
    const total = PRICE.ticket + (bump && bump.checked ? PRICE.bump : 0);
    const row = $("[data-bump-row]");
    const totalEl = $("[data-total]");
    const label = $("[data-submit-label]");

    if (row) row.classList.toggle("hidden", !(bump && bump.checked));
    if (totalEl) totalEl.textContent = euro(total);
    if (label) label.textContent = `Betaal ${euro(total)} En Claim Mijn Plek`;
  }

  /* ------------------------------------------------------------------------
     PROGRESS STEPS
     ---------------------------------------------------------------------- */
  function setStep(n, state) {
    const step = $(`.step[data-step="${n}"]`);
    if (step) step.dataset.state = state;
  }

  function refreshSteps() {
    const identityOk = Object.keys(RULES).every((name) => {
      const input = form.elements[name];
      return input && RULES[name](input.value);
    });
    const paymentOk = identityOk && $("#terms").checked;

    setStep(1, identityOk ? "done" : "current");
    setStep(2, paymentOk ? "done" : identityOk ? "current" : "todo");
    setStep(3, paymentOk ? "current" : "todo");
  }

  /* ------------------------------------------------------------------------
     SEAT-HOLD TIMER
     Honest scarcity: this reflects a real 15-minute cart hold. If the live
     ticketing system does NOT hold seats, delete this rather than let it
     imply something untrue.
     ---------------------------------------------------------------------- */
  function initHoldTimer() {
    const displays = $$("[data-hold-timer]");
    if (!displays.length) return;
    let remaining = 15 * 60;

    const tick = () => {
      const m = Math.floor(remaining / 60);
      const s = remaining % 60;
      displays.forEach((el) => (el.textContent = `${m}:${String(s).padStart(2, "0")}`));
      if (remaining <= 0) {
        displays.forEach((el) => (el.textContent = "verlopen"));
        return;
      }
      remaining -= 1;
      setTimeout(tick, 1000);
    };
    tick();
  }

  /* ------------------------------------------------------------------------
     MINI COUNTDOWN — the strip at the top
     ---------------------------------------------------------------------- */
  function initMiniCountdown() {
    const el = $("[data-mini-countdown]");
    if (!el) return;
    const deadline = new Date(el.dataset.deadline).getTime();
    if (Number.isNaN(deadline)) return;

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { el.textContent = "vandaag"; return; }
      const s = Math.floor(diff / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600);
      const m = Math.floor((s % 3600) / 60);
      el.textContent = `${d}d ${String(h).padStart(2, "0")}u ${String(m).padStart(2, "0")}m`;
      setTimeout(tick, 30000); // minute resolution — no need to burn a tick a second
    };
    tick();
  }

  /* ------------------------------------------------------------------------
     ACCORDION (checkout FAQ)
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
      if (window.gsap && !reduceMotion) gsap.to(panel, { height: "auto", duration: 0.5, ease: "power3.out" });
      else panel.style.height = "auto";
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
        video.play().catch(() => {});
      });
    });

    function closeModal() {
      video.pause();
      video.removeAttribute("src");
      video.load();
      modal.open && modal.close();
    }

    $("[data-modal-close]", modal)?.addEventListener("click", closeModal);
    modal.addEventListener("close", () => video.pause());
    modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
  }

  /* ------------------------------------------------------------------------
     SUBMIT
     ---------------------------------------------------------------------- */
  function initSubmit() {
    const modal = $("#successModal");

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      let firstBad = null;
      Object.keys(RULES).forEach((name) => {
        const input = form.elements[name];
        if (!input) return;
        input.dataset.touched = "1";
        if (!validateField(input) && !firstBad) firstBad = input;
      });

      const terms = $("#terms");
      const termsError = $("#terms-error");
      if (!terms.checked) {
        termsError.style.display = "block";
        if (!firstBad) firstBad = terms;
      } else {
        termsError.style.display = "none";
      }

      if (firstBad) {
        firstBad.focus();
        firstBad.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        return;
      }

      const total = PRICE.ticket + (bump && bump.checked ? PRICE.bump : 0);
      window.fbq && fbq("track", "Purchase", { value: total, currency: "EUR" });

      // ── PRODUCTION HAND-OFF ────────────────────────────────────────────────
      // Replace everything below with the Plug&Pay redirect:
      //   window.location.href = PLUGANDPAY_URL + "?" + new URLSearchParams({...});
      // See README.md for the parameter map.
      // ───────────────────────────────────────────────────────────────────────
      setStep(3, "done");
      modal && modal.showModal();
    });

    $("[data-success-close]")?.addEventListener("click", () => modal.close());
    modal?.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
  }

  /* ------------------------------------------------------------------------
     BOOT
     ---------------------------------------------------------------------- */
  function boot() {
    // These run on any page state; the form-specific ones need the form.
    initAccordion();
    initVideoModal();
    initHoldTimer();
    initMiniCountdown();

    if (!form) return;
    initValidation();
    initSubmit();

    bump && bump.addEventListener("change", () => {
      updateTotal();
      window.fbq && fbq("track", "AddToCart", {
        content_name: "Meditatie-bundel", value: PRICE.bump, currency: "EUR",
      });
    });

    form.addEventListener("input", refreshSteps);
    form.addEventListener("change", refreshSteps);

    updateTotal();
    refreshSteps();
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", boot)
    : boot();
})();
