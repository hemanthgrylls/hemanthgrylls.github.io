(function () {
  var pager = document.querySelector(".poem-pager");
  if (!pager) return;

  var panel = pager.closest(".misc-group");
  var bg = panel ? panel.querySelector(".poem-bg") : null;
  var pages = pager.querySelectorAll(".poem-page");
  var dots = pager.querySelectorAll(".poem-dots .dot");
  var themes = Array.prototype.map.call(pages, function (p) { return p.dataset.theme; });
  var count = pages.length;
  var index = 0;
  var busy = false;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getLines(el) {
    var lines = [""];
    el.childNodes.forEach(function (n) {
      if (n.nodeName === "BR") { lines.push(""); }
      else { lines[lines.length - 1] += n.textContent; }
    });
    return lines.map(function (s) { return s.trim(); }).filter(function (s) { return s.length; });
  }

  // dissolve one element's rendered text into rising, fading particles, then call onDone.
  function dissolveEl(el, onDone) {
    var rect = el.getBoundingClientRect();
    var w = Math.ceil(rect.width), h = Math.ceil(rect.height);
    if (!w || !h) { onDone(); return; }
    var cs = getComputedStyle(el);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cv = document.createElement("canvas");
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.cssText = "position:absolute;left:0;top:0;width:" + w + "px;height:" + h + "px;pointer-events:none;";
    var c = cv.getContext("2d");
    c.scale(dpr, dpr);
    var fs = parseFloat(cs.fontSize);
    var lh = parseFloat(cs.lineHeight) || fs * 1.3;
    c.font = cs.fontStyle + " " + cs.fontWeight + " " + fs + "px " + cs.fontFamily;
    c.textBaseline = "middle";
    c.textAlign = "center";
    c.fillStyle = cs.color;
    var lines = getLines(el);
    var oy = (h - lines.length * lh) / 2;
    for (var j = 0; j < lines.length; j++) c.fillText(lines[j], w / 2, oy + (j + 0.5) * lh);

    var data = c.getImageData(0, 0, cv.width, cv.height).data;
    var step = (w * h > 90000) ? 4 : (w > 480 ? 3 : 2);
    var ps = [];
    for (var y = 0; y < h; y += step) {
      for (var x = 0; x < w; x += step) {
        var idx = (Math.round(y * dpr) * cv.width + Math.round(x * dpr)) * 4;
        if (data[idx + 3] > 90) {
          ps.push({ x: x, y: y, vx: (Math.random() - 0.5) * 1.1, vy: -(0.3 + Math.random() * 1.3), a: 1, d: 0.012 + Math.random() * 0.022, col: data[idx] + "," + data[idx + 1] + "," + data[idx + 2] });
        }
      }
    }
    c.clearRect(0, 0, w, h);
    el.style.position = "relative";
    el.style.color = "transparent";
    el.appendChild(cv);
    function frame() {
      c.clearRect(0, 0, w, h);
      var alive = 0;
      for (var k = 0; k < ps.length; k++) {
        var p = ps[k];
        if (p.a <= 0) continue;
        p.x += p.vx; p.y += p.vy; p.vy += 0.014; p.a -= p.d;
        if (p.a > 0) { alive++; c.globalAlpha = p.a; c.fillStyle = "rgb(" + p.col + ")"; c.fillRect(p.x, p.y, 1.6, 1.6); }
      }
      if (alive > 0) { requestAnimationFrame(frame); }
      else { cv.remove(); onDone(); }
    }
    requestAnimationFrame(frame);
  }

  function updateDots() {
    dots.forEach(function (dot, i) {
      dot.classList.toggle("active", i === index);
      dot.setAttribute("aria-selected", i === index ? "true" : "false");
    });
  }

  function hardSwitch(newIndex) {
    pages[index].style.display = "none";
    index = newIndex;
    pages[index].style.display = "";
    if (bg) bg.className = "poem-bg " + themes[index];
    updateDots();
  }

  function switchTo(newIndex) {
    if (busy || newIndex === index) return;
    if (reduce) { hardSwitch(newIndex); return; }
    busy = true;

    var current = pages[index];
    var textEls = current.querySelectorAll(".poem-title, .poem p, .poem-by");
    if (bg) bg.style.opacity = "0";

    var pending = textEls.length || 1;
    function textDone() {
      if (--pending > 0) return;

      current.style.display = "none";
      textEls.forEach(function (el) { el.style.color = ""; el.style.position = ""; });

      index = newIndex;
      var next = pages[index];
      var nextEls = next.querySelectorAll(".poem-title, .poem p, .poem-by");
      nextEls.forEach(function (el) { el.style.opacity = "0"; });
      next.style.display = "";

      if (bg) { bg.className = "poem-bg " + themes[index]; }
      updateDots();

      requestAnimationFrame(function () {
        if (bg) bg.style.opacity = "1";
        nextEls.forEach(function (el) { el.style.opacity = "1"; });
        setTimeout(function () { busy = false; }, 520);
      });
    }

    if (textEls.length === 0) { textDone(); }
    else { textEls.forEach(function (el) { dissolveEl(el, textDone); }); }
  }

  pager.querySelector(".poem-next").addEventListener("click", function () {
    switchTo((index + 1) % count);
  });

  pager.querySelector(".poem-prev").addEventListener("click", function () {
    switchTo((index - 1 + count) % count);
  });

  dots.forEach(function (dot, i) {
    dot.addEventListener("click", function () { switchTo(i); });
  });

  updateDots();
})();
