/* Featured research: auto-advancing, one-slide-at-a-time carousel. */
(function () {
  "use strict";

  function initCarousel() {
    var track = document.getElementById("featured-track");
    if (!track || !track.children.length) return;
    var slides = track.children;
    var n = slides.length;
    var dots = document.querySelectorAll("#featured-dots .f-dot");
    var idx = 0;
    var paused = false;

    function go(i) {
      idx = i;
      track.style.transform = "translateX(-" + slides[idx].offsetLeft + "px)";
      for (var k = 0; k < dots.length; k++) dots[k].classList.toggle("is-active", k === idx);
    }

    var box = document.getElementById("featured-box");
    if (box) {
      box.addEventListener("mouseenter", function () { paused = true; });
      box.addEventListener("mouseleave", function () { paused = false; });
    }

    var prev = document.getElementById("featured-prev");
    var next = document.getElementById("featured-next");
    if (prev) prev.addEventListener("click", function () { go((idx - 1 + n) % n); });
    if (next) next.addEventListener("click", function () { go((idx + 1) % n); });

    setInterval(function () {
      if (paused) return;
      go((idx + 1) % n);
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousel);
  } else {
    initCarousel();
  }
}());
