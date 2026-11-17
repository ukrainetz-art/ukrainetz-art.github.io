// Lightbox for the gallery and AJAX submit for the contact form. No dependencies.
(function () {
  var box = document.querySelector('.lightbox');
  var links = Array.prototype.slice.call(document.querySelectorAll('.zoom'));
  if (box && links.length) {
    var img = box.querySelector('img');
    var title = box.querySelector('.lb-title');
    var desc = box.querySelector('.lb-desc');
    var current = 0;
    var lastFocus = null;

    var show = function (i) {
      current = (i + links.length) % links.length;
      var a = links[current];
      img.src = a.href;
      img.alt = a.dataset.title || '';
      title.textContent = a.dataset.title || '';
      desc.textContent = a.dataset.desc || '';
    };
    var open = function (i) {
      lastFocus = document.activeElement;
      show(i);
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      box.querySelector('.lb-close').focus();
    };
    var close = function () {
      box.hidden = true;
      img.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    links.forEach(function (a, i) {
      a.addEventListener('click', function (e) { e.preventDefault(); open(i); });
    });
    box.querySelector('.lb-close').addEventListener('click', close);
    box.querySelector('.lb-prev').addEventListener('click', function () { show(current - 1); });
    box.querySelector('.lb-next').addEventListener('click', function () { show(current + 1); });
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    var x0 = null;
    box.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  var form = document.querySelector('.contact-form');
  if (form && window.fetch) {
    var status = form.querySelector('.form-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button');
      btn.disabled = true;
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          status.textContent = form.dataset.ok;
          form.reset();
        })
        .catch(function () { status.textContent = form.dataset.err; })
        .then(function () { btn.disabled = false; });
    });
  }
})();
