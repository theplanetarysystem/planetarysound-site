/* ============================================================
   The Planetary System — planetarysound.com
   - Three.js wireframe subwoofer with orbiting planetary ring
     (echoes the brand logo's Saturn-ring motif)
   - Topbar scroll state
   - Mobile nav toggle
   - Year stamp
   ============================================================ */

(function () {
  'use strict';

  /* ---------- Year ---------- */
  var yearEl = document.getElementById('foot-year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Topbar scroll state ---------- */
  var topbar = document.querySelector('.topbar');
  function onScroll() {
    if (!topbar) return;
    if (window.scrollY > 24) topbar.classList.add('is-scrolled');
    else topbar.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.mobile-toggle');
  var nav = document.getElementById('primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ============================================================
     THREE.JS — wireframe subwoofer + planetary ring
     ============================================================ */
  if (typeof THREE === 'undefined') return;

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var wrap = canvas.parentElement;
  var width = wrap.clientWidth;
  var height = wrap.clientHeight;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 100);
  camera.position.set(0, 0.6, 9.2);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);

  /* ---------- Materials ---------- */
  var lineColor = new THREE.Color(0xe8edf4);        // cool near-white (brand text)
  var lineColorDim = new THREE.Color(0x8893a8);     // cool slate
  var accentColor = new THREE.Color(0x22d3ee);      // electric cyan (signal)
  var accentColorDim = new THREE.Color(0x0e8aa3);

  function lineMat(color, opacity) {
    return new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: opacity == null ? 0.9 : opacity,
    });
  }

  /* ---------- The Subwoofer ---------- */
  // Build a stylized cabinet — proportions of a real PA sub (taller than wide).
  var rig = new THREE.Group();
  scene.add(rig);

  // Cabinet: clean edges only, no triangulation lines.
  var cabinetW = 2.0;
  var cabinetH = 2.6;
  var cabinetD = 1.8;
  var cabinetBox = new THREE.BoxGeometry(cabinetW, cabinetH, cabinetD);
  var cabinetEdges = new THREE.EdgesGeometry(cabinetBox);
  var cabinet = new THREE.LineSegments(cabinetEdges, lineMat(lineColor, 0.85));
  rig.add(cabinet);

  // Inner brace ring across the front baffle — adds detail.
  var braceGeom = new THREE.BufferGeometry();
  var braceVerts = new Float32Array([
    -cabinetW / 2, 0, cabinetD / 2 + 0.001,
     cabinetW / 2, 0, cabinetD / 2 + 0.001,
  ]);
  braceGeom.setAttribute('position', new THREE.BufferAttribute(braceVerts, 3));
  var braceLine = new THREE.LineSegments(braceGeom, lineMat(lineColorDim, 0.4));
  rig.add(braceLine);

  // Driver assembly — sits on the front face (positive Z).
  var driver = new THREE.Group();
  driver.position.z = cabinetD / 2 + 0.001;
  rig.add(driver);

  // Outer surround (torus thin ring).
  var surroundOuter = new THREE.TorusGeometry(0.78, 0.04, 12, 64);
  var surroundOuterEdges = new THREE.EdgesGeometry(surroundOuter);
  var surroundOuterMesh = new THREE.LineSegments(surroundOuterEdges, lineMat(lineColor, 0.7));
  driver.add(surroundOuterMesh);

  // Cone — invert a cone so apex points into the cabinet (negative Z in driver space).
  var coneSegments = 28;
  var coneGeom = new THREE.ConeGeometry(0.72, 0.55, coneSegments, 1, true);
  var coneEdges = new THREE.EdgesGeometry(coneGeom);
  var coneMesh = new THREE.LineSegments(coneEdges, lineMat(lineColor, 0.55));
  coneMesh.rotation.x = Math.PI / 2;       // align axis along Z
  coneMesh.position.z = -0.275;            // pull apex inward
  driver.add(coneMesh);

  // Radial spokes on the cone — adds the "speaker cone" reading.
  var spokesGeom = new THREE.BufferGeometry();
  var spokeCount = 24;
  var spokeVerts = [];
  for (var i = 0; i < spokeCount; i++) {
    var a = (i / spokeCount) * Math.PI * 2;
    var rOuter = 0.72;
    var rInner = 0.12;
    spokeVerts.push(
      Math.cos(a) * rOuter, Math.sin(a) * rOuter, 0,
      Math.cos(a) * rInner, Math.sin(a) * rInner, -0.55
    );
  }
  spokesGeom.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(spokeVerts, 3)
  );
  var spokes = new THREE.LineSegments(spokesGeom, lineMat(lineColorDim, 0.45));
  driver.add(spokes);

  // Inner ring at the apex.
  var innerRing = new THREE.TorusGeometry(0.12, 0.012, 8, 32);
  var innerRingEdges = new THREE.EdgesGeometry(innerRing);
  var innerRingMesh = new THREE.LineSegments(innerRingEdges, lineMat(lineColor, 0.8));
  innerRingMesh.position.z = -0.55;
  driver.add(innerRingMesh);

  // Dust cap — small hemisphere bumping outward.
  var dustGeom = new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  var dustEdges = new THREE.EdgesGeometry(dustGeom);
  var dustMesh = new THREE.LineSegments(dustEdges, lineMat(lineColor, 0.65));
  dustMesh.rotation.x = -Math.PI / 2;
  dustMesh.position.z = 0;
  driver.add(dustMesh);

  // Port slot — rectangular outline below the driver on the front face.
  var portGeom = new THREE.BufferGeometry();
  var px = 0.55, py = 0.18;
  var portYOffset = -1.05;
  var portVerts = new Float32Array([
    -px,  py + portYOffset, 0.001,    px,  py + portYOffset, 0.001,
     px,  py + portYOffset, 0.001,    px, -py + portYOffset, 0.001,
     px, -py + portYOffset, 0.001,   -px, -py + portYOffset, 0.001,
    -px, -py + portYOffset, 0.001,   -px,  py + portYOffset, 0.001,
  ]);
  portGeom.setAttribute('position', new THREE.BufferAttribute(portVerts, 3));
  var port = new THREE.LineSegments(portGeom, lineMat(lineColorDim, 0.5));
  rig.add(port);

  /* ---------- The Planetary Ring (echo of the brand logo) ---------- */
  var ringSystem = new THREE.Group();
  scene.add(ringSystem);

  function buildEllipseRing(radiusX, radiusY, segments, color, opacity) {
    var pts = [];
    for (var i = 0; i <= segments; i++) {
      var t = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(t) * radiusX, 0, Math.sin(t) * radiusY));
    }
    var g = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(g, lineMat(color, opacity));
  }
  // Three concentric ring lines — gives the Saturn-ring banding.
  var ring1 = buildEllipseRing(2.95, 2.95, 96, accentColor, 0.85);
  var ring2 = buildEllipseRing(3.20, 3.20, 96, accentColorDim, 0.55);
  var ring3 = buildEllipseRing(3.42, 3.42, 96, accentColor, 0.35);
  ringSystem.add(ring1);
  ringSystem.add(ring2);
  ringSystem.add(ring3);

  // Tilt the ring system to give it a planet-ring read.
  ringSystem.rotation.x = THREE.MathUtils.degToRad(72);
  ringSystem.rotation.z = THREE.MathUtils.degToRad(-14);

  /* ---------- Initial rig pose ---------- */
  rig.rotation.x = THREE.MathUtils.degToRad(-6);
  rig.rotation.y = THREE.MathUtils.degToRad(-26);

  /* ---------- Pointer-driven parallax ---------- */
  var pointerX = 0, pointerY = 0;
  var targetX = 0, targetY = 0;
  window.addEventListener('pointermove', function (e) {
    var nx = (e.clientX / window.innerWidth) * 2 - 1;
    var ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetX = nx * 0.12;
    targetY = ny * 0.06;
  }, { passive: true });

  /* ---------- Resize ---------- */
  function resize() {
    var w = wrap.clientWidth;
    var h = wrap.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener('resize', resize);
  // Re-fit on font/asset load just in case.
  setTimeout(resize, 200);

  /* ---------- Animation ---------- */
  var prefersReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rafId = null;
  var t0 = performance.now();

  function frame(now) {
    var t = (now - t0) * 0.001;

    // Cabinet: slow Y spin, gentle X breathing.
    rig.rotation.y += prefersReduce ? 0 : 0.0022;
    var breathe = Math.sin(t * 0.6) * 0.04;

    // Pointer easing.
    pointerX += (targetX - pointerX) * 0.04;
    pointerY += (targetY - pointerY) * 0.04;

    rig.rotation.x = THREE.MathUtils.degToRad(-6) + breathe + pointerY * 0.6;
    rig.position.x = pointerX * 0.4;

    // Cone sway — like it's just slightly resonating with the room.
    driver.rotation.z = Math.sin(t * 1.4) * 0.01;

    // Planetary ring counter-rotates slowly.
    ringSystem.rotation.y -= prefersReduce ? 0 : 0.0012;
    ringSystem.position.x = pointerX * 0.4;
    ringSystem.position.y = pointerY * -0.3;

    renderer.render(scene, camera);
    rafId = requestAnimationFrame(frame);
  }
  rafId = requestAnimationFrame(frame);

  // Pause when tab hidden — save battery / GPU.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    } else if (!rafId) {
      t0 = performance.now();
      rafId = requestAnimationFrame(frame);
    }
  });
})();
