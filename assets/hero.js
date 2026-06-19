/* Hero: a curl-noise particle flow field, colored by speed along the
   coolwarm map. One orchestrated motion moment; quiet enough to read over.
   Honors prefers-reduced-motion (renders a single static streak frame). */
(function () {
  "use strict";
  var canvas = document.getElementById("flow");
  if (!canvas || !window.Fields) return;

  var F = window.Fields;
  var hero = canvas.parentElement;
  var ctx, W, H, particles, noise, raf, t0 = 0;
  var GROUND = getComputedStyle(document.documentElement)
    .getPropertyValue("--ground").trim() || "#F5F7FA";

  // a stable seed so the field is the same on every load (no Date/random feel)
  noise = new F.Noise(20260619);

  var SCALE = 0.0016;     // spatial frequency of the flow
  var SPEED = 26;         // advection step
  var COUNT = 0;

  function resize() {
    W = hero.clientWidth;
    H = hero.clientHeight;
    ctx = F.hidpiCanvas(canvas, W, H);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, W, H);
    COUNT = Math.min(680, Math.round((W * H) / 2600));
    spawnAll();
    if (F.reducedMotion()) staticFrame();
  }

  function newParticle() {
    var x = Math.random() * W, y = Math.random() * H;
    return { x: x, y: y, px: x, py: y, life: 40 + Math.random() * 120 };
  }

  function spawnAll() {
    particles = [];
    for (var i = 0; i < COUNT; i++) {
      var p = newParticle();
      p.life = Math.random() * 160; // stagger so trails don't pulse together
      particles.push(p);
    }
  }

  function step(p) {
    var v = F.curl(noise, p.x * SCALE, p.y * SCALE);
    p.px = p.x; p.py = p.y;
    p.x += v.x * SPEED;
    p.y += v.y * SPEED;
    p.life -= 1;
    var speed = Math.min(1, Math.hypot(v.x, v.y) * 0.9);
    if (p.life <= 0 || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
      var n = newParticle();
      p.x = n.x; p.y = n.y; p.px = n.x; p.py = n.y; p.life = n.life;
      return null; // skip drawing the wrap segment
    }
    return speed;
  }

  function drawSeg(p, speed, alpha) {
    var c = F.coolwarm(0.18 + speed * 0.7);
    ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function frame(t) {
    // gentle fade keeps soft trails instead of clearing hard
    ctx.fillStyle = GROUND;
    ctx.globalAlpha = 0.045;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.1;
    ctx.lineCap = "round";
    for (var i = 0; i < particles.length; i++) {
      var s = step(particles[i]);
      if (s !== null) drawSeg(particles[i], s, 0.5);
    }
    raf = requestAnimationFrame(frame);
  }

  function staticFrame() {
    // advance the system silently to paint one rich still frame
    ctx.lineWidth = 1.1; ctx.lineCap = "round";
    for (var k = 0; k < 90; k++) {
      for (var i = 0; i < particles.length; i++) {
        var s = step(particles[i]);
        if (s !== null) drawSeg(particles[i], s, 0.32);
      }
    }
  }

  function start() {
    resize();
    if (!F.reducedMotion()) raf = requestAnimationFrame(frame);
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { cancelAnimationFrame(raf); start(); }, 200);
  });

  // pause when offscreen / tab hidden — keep it light
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else if (!F.reducedMotion()) { raf = requestAnimationFrame(frame); }
  });

  start();
})();
