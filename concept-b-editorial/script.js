/* xybir IR banner (editorial variant) — 300x600, 4-slide carousel
 *
 * Standard HTML5-ad clickTag pattern: ad servers (GAM, DV360, StackAdapt,
 * etc.) look for a top-level `clickTag` variable and rewrite it at
 * trafficking time. Keep it exactly as a plain global var assignment —
 * don't wrap it in a function or bundle it — or most exchanges' macro
 * scanners won't find it.
 */
var clickTag = "https://xybir.com/";

(function () {
  var banner = document.getElementById('banner');
  var cta = document.getElementById('cta');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var prevBtn = document.getElementById('arrow-prev');
  var nextBtn = document.getElementById('arrow-next');

  var current = 0;
  var AUTO_MS = 4500;
  var timer = null;
  var hovering = false;  // a click on an arrow/dot with the pointer still over the banner must not restart rotation

  function goTo(index) {
    index = (index + slides.length) % slides.length;
    if (index === current) return;
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = index;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function restartAuto() {
    if (timer) clearInterval(timer);
    if (hovering) return;
    timer = setInterval(next, AUTO_MS);
  }

  // Manual controls stop propagation so they don't also fire the
  // whole-banner click-through below.
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function (e) {
      e.stopPropagation();
      goTo(i);
      restartAuto();
    });
  });
  nextBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    next();
    restartAuto();
  });
  prevBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    prev();
    restartAuto();
  });

  // Pause the auto-rotation while a desktop viewer is interacting with it.
  banner.addEventListener('mouseenter', function () { hovering = true; if (timer) clearInterval(timer); });
  banner.addEventListener('mouseleave', function () { hovering = false; restartAuto(); });

  // Whole creative is one click target; the CTA anchor also carries the
  // real href so it works if something reads the DOM instead of relying
  // on the JS handler (some exchanges do a static href scan for QA).
  cta.href = clickTag;
  cta.target = '_blank';
  cta.rel = 'noopener';

  banner.addEventListener('click', function (e) {
    if (e.target.closest('#cta, .dot, .nav-arrow')) return;
    window.open(clickTag, '_blank', 'noopener');
  });

  // Fire the entrance sequence + start the carousel once the layout has
  // actually painted, not just on script execution — avoids the stagger
  // jumping straight to its end state on a slow/cold iframe load.
  function goLive() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        banner.classList.add('is-live');
        slides[0].classList.add('active');
        restartAuto();
      });
    });
  }
  if (document.readyState === 'complete') goLive();
  else window.addEventListener('load', goLive);

  // Impression pixel goes here once this is served through an ad server —
  // e.g. new Image().src = 'https://your-tracker/impression?...';
})();
