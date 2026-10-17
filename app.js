const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const loadSpaceScene = async () => {
  const canvas = document.querySelector('#space-canvas');
  if (!canvas) return;
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js');
    initSpaceScene(THREE, canvas);
  } catch (error) {
    console.warn('3D scene unavailable; continuing with accessible page content.', error);
  }
};

function initSpaceScene(THREE, canvas) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0.35, 0.08, 4.8);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const POINTS = window.innerWidth < 700 ? 3000 : 5600;
  const createPalette = (light = false) => light ? {
    cyan: new THREE.Color('#4254c2'), blue: new THREE.Color('#2b2d8f'), gold: new THREE.Color('#4b34fc'), white: new THREE.Color('#1c232d')
  } : {
    cyan: new THREE.Color('#9aa0ff'), blue: new THREE.Color('#6e5cff'), gold: new THREE.Color('#4b34fc'), white: new THREE.Color('#f5f2e9')
  };
  let palette = createPalette(document.documentElement.dataset.theme === 'light');
  const state = { scroll: 0, pointerX: 0, pointerY: 0, targetX: 0, targetY: 0 };
  const seeded = (seed) => {
    let value = seed;
    return () => {
      value = (value * 1664525 + 1013904223) % 4294967296;
      return value / 4294967296;
    };
  };
  const rand = seeded(42);
  const range = (min, max) => min + (max - min) * rand();
  const setColor = (colors, index, color) => {
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  };
  const linePoint = (a, b, t, jitter = 0.04) => ({
    x: a.x + (b.x - a.x) * t + range(-jitter, jitter),
    y: a.y + (b.y - a.y) * t + range(-jitter, jitter),
    z: a.z + (b.z - a.z) * t + range(-jitter, jitter)
  });

  const makeShape = (type) => {
    const positions = new Float32Array(POINTS * 3);
    const colors = new Float32Array(POINTS * 3);
    for (let i = 0; i < POINTS; i += 1) {
      const part = i / POINTS;
      let point = { x: 0, y: 0, z: 0 };
      let color = palette.white;

      if (type === 'rocket') {
        if (part < .58) {
          const y = range(-.95, .82);
          const radius = .32 + (1 - Math.abs(y - .1) / 1.4) * .26;
          const angle = range(0, Math.PI * 2);
          point = { x: Math.cos(angle) * radius * range(.75, 1.05), y, z: Math.sin(angle) * radius * range(.75, 1.05) };
          color = i % 7 === 0 ? palette.gold : (i % 3 === 0 ? palette.cyan : palette.white);
        } else if (part < .72) {
          const y = range(.82, 1.42);
          const angle = range(0, Math.PI * 2);
          const radius = (1.42 - y) * .52;
          point = { x: Math.cos(angle) * radius, y, z: Math.sin(angle) * radius };
          color = i % 2 ? palette.white : palette.cyan;
        } else if (part < .84) {
          const side = i % 2 ? -1 : 1;
          point = { x: side * range(.36, .83), y: range(-.7, .12), z: range(-.14, .14) };
          color = palette.gold;
        } else {
          const angle = range(0, Math.PI * 2);
          const radius = range(.04, .3) * (1 - (part - .84) * 2.7);
          point = { x: Math.cos(angle) * radius, y: range(-1.05, -1.85), z: Math.sin(angle) * radius };
          color = i % 3 ? palette.gold : palette.cyan;
        }
      } else if (type === 'satellite') {
        if (part < .24) {
          point = { x: range(-.32, .32), y: range(-.34, .34), z: range(-.24, .24) };
          color = i % 3 ? palette.white : palette.gold;
        } else if (part < .72) {
          const side = i % 2 ? -1 : 1;
          point = { x: side * range(.42, 1.55), y: range(-.45, .45), z: range(-.04, .04) };
          color = i % 4 ? palette.cyan : palette.white;
        } else if (part < .88) {
          point = { x: range(-.05, .05), y: range(.3, 1.1), z: range(-.05, .05) };
          color = palette.gold;
        } else {
          const angle = range(0, Math.PI * 2);
          point = { x: Math.cos(angle) * range(.25, .55), y: range(-.06, .06), z: Math.sin(angle) * range(.25, .55) };
          color = palette.gold;
        }
      } else if (type === 'globe') {
        const phi = Math.acos(range(-1, 1));
        const theta = range(0, Math.PI * 2);
        const radius = part < .82 ? 1.03 : 1.14;
        point = { x: radius * Math.sin(phi) * Math.cos(theta), y: radius * Math.cos(phi), z: radius * Math.sin(phi) * Math.sin(theta) };
        if (part >= .82) {
          const ring = range(0, Math.PI * 2);
          point = { x: 1.34 * Math.cos(ring), y: range(-.06, .06), z: .34 * Math.sin(ring) };
        }
        color = i % 9 === 0 ? palette.gold : (i % 4 ? palette.cyan : palette.white);
      } else if (type === 'astronaut') {
        const body = { x: 0, y: .05, z: 0 };
        const head = { x: 0, y: 1.02, z: 0 };
        const shoulder = { x: 0, y: .62, z: 0 };
        if (part < .25) {
          const phi = Math.acos(range(-1, 1));
          const theta = range(0, Math.PI * 2);
          point = { x: .27 * Math.sin(phi) * Math.cos(theta), y: 1.02 + .27 * Math.cos(phi), z: .27 * Math.sin(phi) * Math.sin(theta) };
          color = i % 5 ? palette.white : palette.gold;
        } else if (part < .53) {
          point = { x: range(-.25, .25), y: range(-.48, .65), z: range(-.18, .18) };
          color = i % 5 ? palette.white : palette.cyan;
        } else if (part < .67) {
          const t = range(0, 1);
          point = linePoint({ x: -.18, y: .42, z: 0 }, { x: -.52, y: -.45, z: 0 }, t);
          color = palette.cyan;
        } else if (part < .81) {
          const t = range(0, 1);
          point = linePoint({ x: .18, y: .42, z: 0 }, { x: .8, y: 1.05, z: .05 }, t);
          color = i % 3 ? palette.white : palette.gold;
        } else if (part < .92) {
          const t = range(0, 1);
          point = linePoint({ x: -.1, y: -.42, z: 0 }, { x: -.35, y: -1.3, z: .03 }, t);
          color = palette.white;
        } else {
          const t = range(0, 1);
          point = linePoint({ x: .1, y: -.42, z: 0 }, { x: .38, y: -1.3, z: -.03 }, t);
          color = palette.gold;
        }
        if (part > .965) {
          point = { x: range(-.38, .38), y: range(.34, .78), z: range(-.35, -.2) };
          color = palette.blue;
        }
        void body; void head; void shoulder;
      } else if (type === 'cube') {
        const edge = Math.floor(range(0, 12));
        const t = range(-.82, .82);
        const edgePoints = [
          { x: t, y: -.82, z: -.82 }, { x: t, y: .82, z: -.82 }, { x: t, y: -.82, z: .82 }, { x: t, y: .82, z: .82 },
          { x: -.82, y: t, z: -.82 }, { x: .82, y: t, z: -.82 }, { x: -.82, y: t, z: .82 }, { x: .82, y: t, z: .82 },
          { x: -.82, y: -.82, z: t }, { x: .82, y: -.82, z: t }, { x: -.82, y: .82, z: t }, { x: .82, y: .82, z: t }
        ];
        point = edgePoints[edge];
        color = i % 4 ? palette.cyan : palette.gold;
      } else if (type === 'torus') {
        const u = range(0, Math.PI * 2);
        const v = range(0, Math.PI * 2);
        const major = .78;
        const minor = .26;
        point = { x: (major + minor * Math.cos(v)) * Math.cos(u), y: minor * Math.sin(v), z: (major + minor * Math.cos(v)) * Math.sin(u) };
        color = i % 5 ? palette.cyan : palette.gold;
      } else if (type === 'helix') {
        const t = range(-Math.PI * 2.5, Math.PI * 2.5);
        const phase = i % 2 ? Math.PI : 0;
        point = { x: .48 * Math.cos(t + phase), y: t * .22, z: .48 * Math.sin(t + phase) };
        color = i % 4 ? palette.white : palette.gold;
      } else if (type === 'diamond') {
        let x = range(-1, 1); let y = range(-1, 1); let z = range(-1, 1);
        const length = Math.abs(x) + Math.abs(y) + Math.abs(z) || 1;
        x = (x / length) * 1.2; y = (y / length) * 1.2; z = (z / length) * 1.2;
        point = { x, y, z };
        color = i % 3 ? palette.white : palette.gold;
      } else {
        const u = range(0, Math.PI * 2);
        const ring = i % 3;
        if (ring === 0) point = { x: Math.cos(u) * 1.25, y: 0, z: Math.sin(u) * .4 };
        else if (ring === 1) point = { x: Math.cos(u) * .4, y: Math.sin(u) * 1.25, z: 0 };
        else point = { x: range(-.2, .2), y: range(-.2, .2), z: range(-.2, .2) };
        color = ring === 2 ? palette.gold : palette.cyan;
      }
      const index = i * 3;
      positions[index] = point.x;
      positions[index + 1] = point.y;
      positions[index + 2] = point.z;
      setColor(colors, i, color);
    }
    return { positions, colors };
  };

  const shapeTypes = ['rocket', 'satellite', 'globe', 'astronaut', 'cube', 'torus', 'helix', 'diamond', 'orbit'];
  for (let i = shapeTypes.length - 1; i > 1; i -= 1) {
    const j = 1 + Math.floor(Math.random() * i);
    [shapeTypes[i], shapeTypes[j]] = [shapeTypes[j], shapeTypes[i]];
  }
  const shapeLabels = { rocket: 'SOFTWARE SYSTEMS', satellite: 'NETWORK INFRASTRUCTURE', globe: 'CLOUD + DATA', astronaut: 'SUPPORT THAT STAYS', cube: 'BUSINESS SYSTEMS', torus: 'API INTEGRATION', helix: 'PROCESS AUTOMATION', diamond: 'SECURITY + TRUST', orbit: 'PEOPLE + PROGRESS' };
  const names = shapeTypes.map((type, index) => `${String(index + 1).padStart(2, '0')} / ${shapeLabels[type]}`);
  let shapes = shapeTypes.map(makeShape);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(new Float32Array(shapes[0].positions), 3);
  const colorAttribute = new THREE.BufferAttribute(new Float32Array(shapes[0].colors), 3);
  geometry.setAttribute('position', positionAttribute);
  geometry.setAttribute('color', colorAttribute);
  const particleMaterial = new THREE.PointsMaterial({ size: window.innerWidth < 700 ? .032 : .026, vertexColors: true, transparent: true, opacity: .95, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
  const particles = new THREE.Points(geometry, particleMaterial);
  particles.rotation.z = -.18;
  particles.position.x = window.innerWidth < 700 ? .4 : 0;
  particles.scale.set(1.12, 1.12, 1.12);
  scene.add(particles);

  const starPositions = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i += 1) {
    starPositions[i * 3] = range(-8, 8);
    starPositions[i * 3 + 1] = range(-6, 6);
    starPositions[i * 3 + 2] = range(-8, 2);
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0x8b7cff, size: .016, transparent: true, opacity: .55, blending: THREE.AdditiveBlending });
  const stars = new THREE.Points(starGeometry, starMaterial);
  scene.add(stars);

  const refreshTheme = (light) => {
    palette = createPalette(light);
    shapes = shapeTypes.map(makeShape);
    positionAttribute.array.set(shapes[0].positions);
    colorAttribute.array.set(shapes[0].colors);
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    particleMaterial.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    particleMaterial.opacity = light ? .84 : .92;
    starMaterial.color.set(light ? '#4b34fc' : '#8b7cff');
    starMaterial.opacity = light ? .28 : .55;
    starMaterial.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
  };
  window.addEventListener('df-theme-change', (event) => refreshTheme(Boolean(event.detail?.light)));

  const sceneName = document.querySelector('#scene-name');
  const sceneProgress = document.querySelector('#scene-progress');
  const cursor = document.querySelector('.space-cursor');
  const updateScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    state.scroll = Math.max(0, Math.min(1, window.scrollY / max));
  };
  const updatePointer = (event) => {
    state.targetX = (event.clientX / window.innerWidth - .5) * 2.5;
    state.targetY = -(event.clientY / window.innerHeight - .5) * 1.8;
    if (cursor) {
      cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      cursor.classList.add('is-active');
    }
  };
  const resize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('pointermove', updatePointer, { passive: true });
  window.addEventListener('resize', resize);
  updateScroll();

  const clock = new THREE.Clock();
  const render = () => {
    const elapsed = clock.getElapsedTime();
    const total = state.scroll * (shapes.length - 1);
    const fromIndex = Math.min(shapes.length - 2, Math.floor(total));
    const mix = total >= shapes.length - 1 ? 1 : total - fromIndex;
    const eased = mix * mix * (3 - 2 * mix);
    state.pointerX += (state.targetX - state.pointerX) * .05;
    state.pointerY += (state.targetY - state.pointerY) * .05;
    const from = shapes[fromIndex].positions;
    const to = shapes[Math.min(shapes.length - 1, fromIndex + 1)].positions;
    const fromColors = shapes[fromIndex].colors;
    const toColors = shapes[Math.min(shapes.length - 1, fromIndex + 1)].colors;
    for (let i = 0; i < POINTS; i += 1) {
      const index = i * 3;
      let x = from[index] + (to[index] - from[index]) * eased;
      let y = from[index + 1] + (to[index + 1] - from[index + 1]) * eased;
      let z = from[index + 2] + (to[index + 2] - from[index + 2]) * eased;
      const breeze = reduceMotion ? 0 : Math.sin(elapsed * .8 + i * .019) * .012;
      x += breeze;
      y += Math.cos(elapsed * .65 + i * .013) * .009;
      const dx = x - state.pointerX;
      const dy = y - state.pointerY;
      const distance = Math.hypot(dx, dy);
      if (!reduceMotion && distance < .85) {
        const force = (1 - distance / .85) * .17;
        x += (dx / Math.max(distance, .01)) * force;
        y += (dy / Math.max(distance, .01)) * force;
        z += force * .35;
      }
      positionAttribute.array[index] = x;
      positionAttribute.array[index + 1] = y;
      positionAttribute.array[index + 2] = z;
      colorAttribute.array[index] = fromColors[index] + (toColors[index] - fromColors[index]) * eased;
      colorAttribute.array[index + 1] = fromColors[index + 1] + (toColors[index + 1] - fromColors[index + 1]) * eased;
      colorAttribute.array[index + 2] = fromColors[index + 2] + (toColors[index + 2] - fromColors[index + 2]) * eased;
    }
    positionAttribute.needsUpdate = true;
    colorAttribute.needsUpdate = true;
    particles.rotation.y += reduceMotion ? 0 : .0015;
    particles.rotation.x = state.pointerY * .025;
    stars.rotation.y = elapsed * .006 + state.pointerX * .01;
    stars.position.x = state.pointerX * .08;
    camera.position.x += ((.5 + state.pointerX * .2 + Math.sin(total * .8) * .28) - camera.position.x) * .035;
    camera.position.y += ((state.pointerY * .12 + Math.cos(total * .7) * .12) - camera.position.y) * .035;
    camera.position.z += ((4.6 - Math.sin(total * Math.PI / 3) * .6) - camera.position.z) * .035;
    camera.lookAt(0, .03, 0);
    if (sceneName) sceneName.textContent = names[Math.min(names.length - 1, Math.round(total))];
    if (sceneProgress) sceneProgress.textContent = `${String(Math.round(state.scroll * 100)).padStart(2, '0')}.00`;
    renderer.render(scene, camera);
    if (!reduceMotion) requestAnimationFrame(render);
  };
  render();
}

loadSpaceScene();

const themeToggle = document.querySelector('.theme-toggle');
const applyTheme = (light, animate = false) => {
  if (animate && !reduceMotion) {
    document.documentElement.classList.remove('theme-transition');
    void document.documentElement.offsetWidth;
    document.documentElement.classList.add('theme-transition');
    window.setTimeout(() => document.documentElement.classList.remove('theme-transition'), 860);
  }
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  themeToggle?.setAttribute('aria-pressed', String(light));
  themeToggle?.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
  const label = themeToggle?.querySelector('.theme-label');
  if (label) label.textContent = light ? 'Dark' : 'Light';
  document.querySelectorAll('.brand-logo').forEach((logo) => {
    logo.src = light ? logo.dataset.lightSrc : logo.dataset.darkSrc;
  });
  window.dispatchEvent(new CustomEvent('df-theme-change', { detail: { light } }));
};
let savedTheme = new URLSearchParams(window.location.search).get('theme') || 'dark';
try { if (!window.location.search) savedTheme = localStorage.getItem('df-theme') || 'dark'; } catch { /* storage can be unavailable in private embeds */ }
applyTheme(savedTheme === 'light');
themeToggle?.addEventListener('click', () => {
  const light = document.documentElement.dataset.theme !== 'light';
  applyTheme(light, true);
  try { localStorage.setItem('df-theme', light ? 'light' : 'dark'); } catch { /* non-persistent embeds still toggle */ }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: .14 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));

const menuToggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const setMenuState = (open, returnFocus = false) => {
  if (!menuToggle || !mobileNav) return;
  mobileNav.hidden = !open;
  mobileNav.inert = !open;
  mobileNav.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (!open && returnFocus) menuToggle.focus();
};
menuToggle?.addEventListener('click', () => setMenuState(!mobileNav.classList.contains('is-open')));
mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false, true)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobileNav?.classList.contains('is-open')) setMenuState(false, true);
});
