/* ── NAV HAMBURGER ─────────────────────────── */
(function () {
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks  = document.getElementById('nav-links');
  const overlay   = document.getElementById('nav-overlay');

  if (!hamburger || !navLinks) return;

  function openMenu()  {
    hamburger.classList.add('open');
    navLinks.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  function toggleMenu() {
    navLinks.classList.contains('open') ? closeMenu() : openMenu();
  }

  hamburger.addEventListener('click', toggleMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);
  navLinks.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
})();

/* ── SCROLL FADE-IN ────────────────────────── */
(function () {
  function makeVisible(root) {
    (root || document).querySelectorAll('.fade-in-section').forEach(function (s) {
      s.classList.add('is-visible');
    });
  }

  // In the Shopify theme editor, skip animation entirely so sections
  // stay visible after block add/remove/reorder
  if (window.Shopify && window.Shopify.designMode) {
    makeVisible();
    document.addEventListener('shopify:section:load', function (e) { makeVisible(e.target); });
    document.addEventListener('shopify:block:select', function (e) { makeVisible(e.target.closest('section')); });
    return;
  }

  var sections = document.querySelectorAll('.fade-in-section');
  if (!sections.length) return;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  sections.forEach(function (s) { observer.observe(s); });
})();

/* ── PRODUCT VARIANT PRICE UPDATE ─────────── */
(function () {
  var variantSelect = document.getElementById('variant-select');
  if (!variantSelect) return;

  variantSelect.addEventListener('change', function () {
    // Shopify's Ajax API can be used here for real-time price updates
    // For now, page reload on form submit handles variant selection
  });
})();
