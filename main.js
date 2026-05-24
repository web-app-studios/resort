(function () {
  document.documentElement.classList.add('js');
  var header = document.getElementById('siteHeader');
  var toggle = document.getElementById('menuToggle');
  var drawer = document.getElementById('mobileDrawer');

  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (drawer) drawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
  }
  if (drawer) {
    drawer.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('menu-open');
        if (toggle) toggle.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('aria-hidden', 'true');
      });
    });
  }

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    var duration = 1600;
    var start = performance.now();
    function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }
    el.textContent = fmt(0);
    function step(now) {
      var p = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    }
    var safety = setTimeout(function () { el.textContent = fmt(target); }, duration + 400);
    requestAnimationFrame(step);
    var clearer = setInterval(function () {
      if (el.textContent === fmt(target)) { clearTimeout(safety); clearInterval(clearer); }
    }, 200);
  }

  var countTargets = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && countTargets.length) {
    var statSection = document.querySelector('.stats, .stats-light');
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          countTargets.forEach(function (el) { animateCount(el); });
          countObs.disconnect();
        }
      });
    }, { threshold: 0.15 });
    if (statSection) countObs.observe(statSection);
    else countTargets.forEach(function (el) { animateCount(el); });
  } else {
    countTargets.forEach(function (el) {
      el.textContent = (parseInt(el.getAttribute('data-count'), 10) || 0).toLocaleString('en-IN');
    });
  }

  // Enquiry form: progressive enhancement only (no backend wired).
  var form = document.getElementById('enquiryForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = document.getElementById('enquiryStatus');
      if (status) {
        status.textContent = "Thanks — we've received your message and will get back to you shortly.";
        status.style.color = 'var(--forest)';
      }
      form.reset();
    });
  }
})();
