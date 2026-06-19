/* Shared field utilities: value noise, curl field, and the CFD
   "coolwarm" diverging colormap. No dependencies. */
(function (global) {
  "use strict";

  // --- value noise (hashed lattice, smoothstep interpolation) ---
  function makePermutation(seed) {
    var p = new Uint8Array(512);
    var s = seed >>> 0 || 1;
    for (var i = 0; i < 256; i++) p[i] = i;
    // Fisher–Yates with an LCG so results are deterministic per seed
    for (var j = 255; j > 0; j--) {
      s = (1103515245 * s + 12345) & 0x7fffffff;
      var k = s % (j + 1);
      var t = p[j]; p[j] = p[k]; p[k] = t;
    }
    for (var m = 0; m < 256; m++) p[256 + m] = p[m];
    return p;
  }

  function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function Noise(seed) {
    var p = makePermutation(seed);
    function grad(ix, iy) {            // pseudo-random value in [-1,1]
      var h = p[(p[ix & 255] + iy) & 255];
      return (h / 255) * 2 - 1;
    }
    this.at = function (x, y) {        // value noise in [-1,1]
      var x0 = Math.floor(x), y0 = Math.floor(y);
      var fx = fade(x - x0), fy = fade(y - y0);
      var v00 = grad(x0, y0), v10 = grad(x0 + 1, y0);
      var v01 = grad(x0, y0 + 1), v11 = grad(x0 + 1, y0 + 1);
      return lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy);
    };
  }

  // fractal sum (a couple of octaves) — enough for organic flow
  Noise.prototype.fbm = function (x, y) {
    return this.at(x, y) * 0.65 + this.at(x * 2.1 + 5.2, y * 2.1 - 1.7) * 0.35;
  };

  // divergence-free velocity from the gradient of a scalar field -> swirls
  function curl(noise, x, y, e) {
    e = e || 0.001;
    var n1 = noise.fbm(x, y + e), n2 = noise.fbm(x, y - e);
    var n3 = noise.fbm(x + e, y), n4 = noise.fbm(x - e, y);
    return { x: (n1 - n2) / (2 * e), y: -(n3 - n4) / (2 * e) };
  }

  // coolwarm diverging colormap, t in [0,1] -> "rgb(...)"
  // anchored on Moreland's blue->white->red endpoints.
  var STOPS = [
    [0.0, 59, 76, 192],
    [0.25, 110, 143, 224],
    [0.5, 235, 232, 226],
    [0.75, 218, 116, 94],
    [1.0, 180, 4, 38]
  ];
  function coolwarm(t) {
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    for (var i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i];
        var f = (t - a[0]) / (b[0] - a[0]);
        return [
          Math.round(lerp(a[1], b[1], f)),
          Math.round(lerp(a[2], b[2], f)),
          Math.round(lerp(a[3], b[3], f))
        ];
      }
    }
    return [180, 4, 38];
  }

  function hidpiCanvas(canvas, w, h) {
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function reducedMotion() {
    return global.matchMedia &&
      global.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  global.Fields = {
    Noise: Noise,
    curl: curl,
    coolwarm: coolwarm,
    hidpiCanvas: hidpiCanvas,
    reducedMotion: reducedMotion
  };
})(window);
