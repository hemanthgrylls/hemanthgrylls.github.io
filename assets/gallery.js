/* Fluid Gallery: procedural flow visualizations rendered to <canvas>.
   Each <canvas data-field="..."> gets a different field, painted once into
   ImageData with the coolwarm colormap. These are placeholders tuned to
   Hemanth's work — replace any tile with real schlieren / simulation media. */
(function () {
  "use strict";
  if (!window.Fields) return;
  var F = window.Fields;
  var noise = new F.Noise(70814);

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  // each field: (u, v) in [0,1] -> scalar in [0,1] for the colormap
  var FIELDS = {
    vorticity: function (u, v) {
      var s = 6.0;
      var c = F.curl(noise, u * s, v * s, 0.01);
      return clamp01(0.5 + (c.x + c.y) * 0.9);
    },
    kelvin_helmholtz: function (u, v) {
      // two shear layers; sinusoidal roll-up displaced by noise -> billows
      var disp = 0.06 * Math.sin(u * 18) + 0.05 * noise.fbm(u * 4, v * 4);
      var layer = v + disp;
      var band = Math.sin(layer * Math.PI * 3.0);
      return clamp01(0.5 + band * 0.5);
    },
    shock_cells: function (u, v) {
      // under-expanded jet: diamond shock cells decaying downstream
      var axis = 1 - Math.abs(v - 0.5) * 2;          // core brightest on axis
      var decay = Math.exp(-u * 1.4);
      var cells = Math.sin(u * 34) * Math.cos((v - 0.5) * 26);
      return clamp01(0.5 + cells * 0.5 * decay * (0.3 + axis * 0.7));
    },
    schlieren: function (u, v) {
      // density-gradient magnitude of a turbulent field (grayscale-like center)
      var n1 = noise.fbm(u * 9, v * 9);
      var n2 = noise.fbm(u * 9 + 0.02, v * 9);
      var g = (n2 - n1) * 30;
      return clamp01(0.5 + g);
    },
    diffraction: function (u, v) {
      // shock diffracting around a corner at bottom-left -> expanding arcs
      var dx = u - 0.05, dy = v - 0.95;
      var r = Math.sqrt(dx * dx + dy * dy);
      var wave = Math.sin(r * 46 - 1.2);
      var fall = clamp01(1 - r * 0.7);
      return clamp01(0.5 + wave * 0.5 * fall);
    },
    spectral: function (u, v) {
      // dispersion: superposed modes whose wavenumber grows with u
      var k = 6 + u * 30;
      var a = Math.sin(u * k) * Math.cos(v * (k * 0.6));
      var b = noise.fbm(u * 3, v * 3) * 0.4;
      return clamp01(0.5 + (a * 0.5 + b) * 0.6);
    }
  };

  function render(canvas) {
    var fn = FIELDS[canvas.dataset.field];
    if (!fn) return;
    var rect = canvas.getBoundingClientRect();
    var w = Math.max(2, Math.round(rect.width));
    var h = Math.max(2, Math.round(rect.height));
    // render at a capped internal resolution, then let CSS scale to fill
    var rw = Math.min(w, 360), rh = Math.min(h, 240);
    canvas.width = rw; canvas.height = rh;
    var ctx = canvas.getContext("2d");
    var img = ctx.createImageData(rw, rh);
    var d = img.data, i = 0;
    for (var y = 0; y < rh; y++) {
      for (var x = 0; x < rw; x++) {
        var c = F.coolwarm(fn(x / rw, y / rh));
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
        i += 4;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function renderAll() {
    var cs = document.querySelectorAll("canvas[data-field]");
    for (var i = 0; i < cs.length; i++) render(cs[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderAll);
  } else {
    renderAll();
  }
})();
