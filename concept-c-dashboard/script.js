/* xybir IR banner — Concept C: Concept A's slides + a work-email
 * call-request field — 300x600, 4-slide carousel
 *
 * Standard HTML5-ad clickTag pattern: ad servers (GAM, DV360, StackAdapt,
 * etc.) look for a top-level `clickTag` variable and rewrite it at
 * trafficking time. Keep it exactly as a plain global var assignment —
 * don't wrap it in a function or bundle it — or most exchanges' macro
 * scanners won't find it.
 */
var clickTag = "https://xybir.com/";

// Where the in-banner email sign-up is sent. Set this to the IR team's
// list endpoint (Mailchimp/HubSpot/Klaviyo form action, a Netlify/Zapier
// webhook, etc.). The email is POSTed as a normal form field named
// "email", plus "source=xybir-banner-300x600".
// While it's left empty, submitting opens SIGNUP_FALLBACK_URL in a new tab:
// brand.json "signup_url" (the company's own email-alert page, best) or else the
// landing page's investor-alerts section (#schedule). The address is NOT
// captured. It's deliberately not appended to that URL as ?email=: IR
// landing pages don't read it, so it would only leak into server logs.
var SIGNUP_ENDPOINT = "";
var SIGNUP_FALLBACK_URL = clickTag.replace(/\/?$/, '/') + "#schedule";

(function () {
  var banner = document.getElementById('banner');
  var form = document.getElementById('signup');
  var emailInput = document.getElementById('signup-email');
  var msg = document.getElementById('signup-msg');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.dot'));
  var prevBtn = document.getElementById('arrow-prev');
  var nextBtn = document.getElementById('arrow-next');

  var current = 0;
  var AUTO_MS = 4500;
  var timer = null;
  var hovering = false, typing = false;

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
    if (hovering || typing) return;
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
  // Also hold it while the email field has focus, so the slides don't
  // keep flipping behind someone mid-typing (mobile has no mouseleave).
  // Rotation resumes on mouseleave / blur, unless the other is still true.
  function pause() { if (timer) clearInterval(timer); }
  banner.addEventListener('mouseenter', function () { hovering = true; pause(); });
  banner.addEventListener('mouseleave', function () { hovering = false; restartAuto(); });
  emailInput.addEventListener('focus', function () { typing = true; pause(); });
  emailInput.addEventListener('blur', function () { typing = false; restartAuto(); });

  // ── In-banner email sign-up ────────────────────────────────────
  var EMAIL_RE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[^\s@.]{2,}$/;   // no spaces, no '..'

  function showError(text) {
    form.classList.remove('is-error');
    void form.offsetWidth; // restart the shake animation
    form.classList.add('is-error');
    msg.textContent = text;
  }
  function showDone() {
    form.classList.remove('is-error', 'is-sending');
    form.classList.add('is-done');
    document.getElementById('signup-done').setAttribute('aria-hidden', 'false');
    emailInput.blur();
  }

  emailInput.addEventListener('input', function () {
    if (form.classList.contains('is-error')) {
      form.classList.remove('is-error');
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = emailInput.value.trim();
    if (!EMAIL_RE.test(email)) {
      showError('Please enter a valid email address');
      emailInput.focus();
      return;
    }

    if (!SIGNUP_ENDPOINT) {
      // No list endpoint yet: the address isn't captured here, so don't
      // claim a subscription. Point the visitor at the tab just opened.
      document.getElementById('signup-done-text').textContent =
        'Form opened in a new tab.';
      window.open(SIGNUP_FALLBACK_URL, '_blank', 'noopener');
      showDone();
      return;
    }

    document.getElementById('signup-done-text').textContent = 'Request sent. We will be in touch.'; // ENDPOINT_DONE_TEXT
    form.classList.add('is-sending');
    var body = new URLSearchParams({ email: email, source: 'xybir-banner-300x600' });
    // no-cors: most list providers' form endpoints don't send CORS
    // headers, and the banner only needs the request delivered.
    fetch(SIGNUP_ENDPOINT, { method: 'POST', mode: 'no-cors', body: body })
      .then(showDone)
      .catch(function () {
        form.classList.remove('is-sending');
        showError('Something went wrong — please try again');
      });
  });

  // Clicks anywhere else on the creative go to the single clickTag URL;
  // the email field, Subscribe, the privacy link and carousel controls are excluded.
  banner.addEventListener('click', function (e) {
    // Only the controls are excluded; the consent text and disclosure line click through like the rest.
    if (e.target.closest('#signup-row, #signup-consent a, .dot, .nav-arrow')) return;
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
