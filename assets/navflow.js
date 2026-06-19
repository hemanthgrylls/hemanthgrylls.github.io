/* Nav background: the same curl-noise particle flow as the old hero, tuned
   for the thin top bar. Subtle, paused when hidden, static for reduced-motion. */
(function () {
  "use strict";
  var canvas = document.getElementById("navflow");
  if (!canvas || !window.Fields) return;

  var F = window.Fields;
  var nav = canvas.parentElement;
  var ctx, W, H, particles, raf;
  var GROUND = getComputedStyle(document.documentElement)
    .getPropertyValue("--ground").trim() || "#F5F7FA";
  var noise = new F.Noise(20260619);   // same seed as the old hero field

  var SCALE = 0.0022;
  var SPEED = 22;
  var COUNT = 0;

  function resize() {
    W = nav.clientWidth;
    H = nav.clientHeight;
    if (!W || !H) return;
    ctx = F.hidpiCanvas(canvas, W, H);
    ctx.fillStyle = GROUND;
    ctx.fillRect(0, 0, W, H);
    COUNT = Math.min(240, Math.round((W * H) / 240));
    spawnAll();
    if (F.reducedMotion()) staticFrame();
  }

  function newParticle() {
    var x = Math.random() * W, y = Math.random() * H;
    // fixed color per particle: ~half blue end, ~half red end of coolwarm
    var cv = Math.random() < 0.5 ? Math.random() * 0.2 : 0.8 + Math.random() * 0.2;
    return { x: x, y: y, px: x, py: y, life: 30 + Math.random() * 90, cv: cv };
  }

  function spawnAll() {
    particles = [];
    for (var i = 0; i < COUNT; i++) {
      var p = newParticle();
      p.life = Math.random() * 110;
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
      return null;
    }
    return speed;
  }

  function drawSeg(p, alpha) {
    var c = F.coolwarm(p.cv);
    ctx.strokeStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + alpha + ")";
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  function frame() {
    ctx.fillStyle = GROUND;
    ctx.globalAlpha = 0.05;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (var i = 0; i < particles.length; i++) {
      var s = step(particles[i]);
      if (s !== null) drawSeg(particles[i], 0.18);
    }
    raf = requestAnimationFrame(frame);
  }

  function staticFrame() {
    ctx.lineWidth = 1; ctx.lineCap = "round";
    for (var k = 0; k < 80; k++) {
      for (var i = 0; i < particles.length; i++) {
        var s = step(particles[i]);
        if (s !== null) drawSeg(particles[i], 0.13);
      }
    }
  }

  function start() {
    resize();
    if (W && H && !F.reducedMotion()) raf = requestAnimationFrame(frame);
  }

  var rt;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { cancelAnimationFrame(raf); start(); }, 200);
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (!F.reducedMotion()) raf = requestAnimationFrame(frame);
  });

  start();
})();
