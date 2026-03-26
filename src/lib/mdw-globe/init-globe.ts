import * as THREE from "three";
import {
  MDW_AUTO_SPEED_MULTIPLIER,
  MDW_CTA_RULES,
  MDW_IMAGE_URLS,
  MDW_LOGO_URL,
  type MdwCtaRule,
} from "./config";

type MdwContainer = HTMLElement & { __mdwInited?: boolean; __raf?: number };

function getCSS(el: HTMLElement, property: string, fallback = "0"): string {
  const v = getComputedStyle(el).getPropertyValue(property);
  return v?.trim() ? v.trim() : fallback;
}

function ensureHasSize(container: HTMLElement) {
  if (container.clientHeight < 10) container.style.height = container.style.height || "550px";
}

function getCTAForIndex(idx: number): MdwCtaRule | null {
  for (const rule of MDW_CTA_RULES) {
    if (idx >= rule.from && idx <= rule.to) return rule;
  }
  return null;
}

function shuffledArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isTouchDevice(): boolean {
  return "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
}

const MDW_LIGHTBOX_ROOT_ID = "fms-mdw-globe-lightbox-root";

function applyLightboxViewportLock(el: HTMLElement) {
  Object.assign(el.style, {
    position: "fixed",
    inset: "0",
    width: "100%",
    height: "100%",
    maxHeight: "none",
    margin: "0",
    padding: "0",
    boxSizing: "border-box",
    zIndex: "2147483647",
  });
}

function makeLightboxOnce(): HTMLElement {
  let lb = document.getElementById(MDW_LIGHTBOX_ROOT_ID) as HTMLElement | null;
  if (lb && document.body.contains(lb)) {
    applyLightboxViewportLock(lb);
    return lb;
  }

  document.querySelectorAll(".mdw-globe-lightbox").forEach((n) => n.remove());

  lb = document.createElement("div");
  lb.id = MDW_LIGHTBOX_ROOT_ID;
  lb.className = "mdw-globe-lightbox";
  lb.setAttribute("role", "presentation");
  applyLightboxViewportLock(lb);
  lb.innerHTML = `
      <div class="mdw-globe-lightbox__panel" role="dialog" aria-modal="true">
        <div class="mdw-globe-lightbox__imgwrap">
          <img class="mdw-globe-lightbox__imgbase" alt="" referrerpolicy="no-referrer" decoding="async" />
          <img class="mdw-globe-lightbox__imgoverlay" alt="" aria-hidden="true" hidden referrerpolicy="no-referrer" decoding="async" />
        </div>
      </div>

      <div class="mdw-globe-lightbox__bar">
        <div class="mdw-globe-lightbox__left">
          <button class="mdw-globe-btn mdw-globe-btn--ghost mdw-globe-btn--prev" type="button">◀</button>
          <button class="mdw-globe-btn mdw-globe-btn--ghost mdw-globe-btn--next" type="button">▶</button>
          <div class="mdw-globe-lightbox__counter"></div>
        </div>

        <div></div>

        <div class="mdw-globe-lightbox__right">
          <a class="mdw-globe-btn mdw-globe-btn--cta mdw-globe-btn--ctaLink" href="#" target="_blank" rel="noopener">Explore</a>
          <button class="mdw-globe-btn mdw-globe-btn--ghost mdw-globe-btn--close" type="button" aria-label="Close">✕</button>
        </div>
      </div>
    `;
  document.body.appendChild(lb);

  const panelEl = lb.querySelector(".mdw-globe-lightbox__panel");
  lb.addEventListener("click", (e) => {
    if (e.target === lb || e.target === panelEl) lb?.classList.remove("is-open");
  });
  lb.querySelector(".mdw-globe-btn--close")?.addEventListener("click", () => lb?.classList.remove("is-open"));

  window.addEventListener("keydown", (e) => {
    if (!lb?.classList.contains("is-open")) return;
    if (e.key === "Escape") lb.classList.remove("is-open");
  });

  return lb;
}

function createTwinkleStars(scene: THREE.Scene) {
  const STAR_COUNT = 1600;
  const STAR_RADIUS = 190;

  const positions = new Float32Array(STAR_COUNT * 3);
  const phase = new Float32Array(STAR_COUNT);

  for (let i = 0; i < STAR_COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() * 2 - 1) * STAR_RADIUS;
    positions[i * 3 + 1] = (Math.random() * 2 - 1) * STAR_RADIUS;
    positions[i * 3 + 2] = (Math.random() * 2 - 1) * STAR_RADIUS;
    phase[i] = Math.random() * Math.PI * 2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: 0.26 },
      uAmp: { value: 0.42 },
      uSize: { value: 2.1 },
    },
    vertexShader: `
        attribute float aPhase;
        varying float vPhase;
        uniform float uSize;
        void main(){
          vPhase = aPhase;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = uSize * (320.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
    fragmentShader: `
        varying float vPhase;
        uniform float uTime;
        uniform float uBase;
        uniform float uAmp;
        void main(){
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float mask = smoothstep(0.5, 0.18, d);
          float tw = 0.5 + 0.5 * sin(uTime * 1.35 + vPhase);
          float a = (uBase + uAmp * tw) * mask;
          gl_FragColor = vec4(1.0, 1.0, 1.0, a);
        }
      `,
  });

  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  return { points: pts, material: mat };
}

/** Mount globe into container; returns disposer. */
export function initMdwGlobe(container: HTMLElement): () => void {
  const c = container as MdwContainer;
  if (c.__mdwInited) return () => {};
  c.__mdwInited = true;

  ensureHasSize(container);

  const basePlaneW = parseFloat(getCSS(container, "--image-width", "10")) / (100 / 9);
  const basePlaneH = parseFloat(getCSS(container, "--image-height", "10")) / (100 / 9);
  const imageScale = parseFloat(getCSS(container, "--image-scale", "1.65"));
  const planeWidth = basePlaneW * imageScale;
  const planeHeight = basePlaneH * imageScale;
  const planeRatio = planeWidth / planeHeight;

  const sphereRadius = parseFloat(getCSS(container, "--sphere-radius", "3.9"));

  const requestedLogoSize = parseFloat(getCSS(container, "--logo-size", "1.9"));
  const logoBaseSize = Math.min(requestedLogoSize, sphereRadius * 0.5);

  const repeat = parseFloat(getCSS(container, "--image-repeat", "1"));
  const totalItems = Math.floor(MDW_IMAGE_URLS.length * repeat);
  const disposers: Array<() => void> = [];

  if (totalItems < 1) {
    return () => {
      c.__mdwInited = false;
    };
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    75,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    2000,
  );

  function applyDesktopSizing() {
    const isDesktop = window.matchMedia("(min-width: 992px)").matches;
    camera.fov = isDesktop ? 70 : 75;
    camera.position.z = isDesktop ? 6.2 : 8.5;
    camera.updateProjectionMatrix();
  }
  applyDesktopSizing();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(container.clientWidth, container.clientHeight);

  const dpr = window.devicePixelRatio || 1;
  const capped = isTouchDevice() ? Math.min(dpr, 1.6) : Math.min(dpr, 2.0);
  renderer.setPixelRatio(capped);

  renderer.setClearColor(0x000000, 1);
  if (THREE.ColorManagement) THREE.ColorManagement.enabled = true;
  if ("outputColorSpace" in renderer && THREE.SRGBColorSpace) {
    renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  container.appendChild(renderer.domElement);

  const stars = createTwinkleStars(scene);

  const sphereGroup = new THREE.Group();
  scene.add(sphereGroup);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(6, 3, 10);
  scene.add(dir);
  const back = new THREE.DirectionalLight(0xffffff, 0.18);
  back.position.set(-8, -4, -10);
  scene.add(back);

  const maxAniso = renderer.capabilities.getMaxAnisotropy?.() || 1;
  const anisoUse = Math.min(maxAniso, isTouchDevice() ? 4 : 12);

  new THREE.TextureLoader().load(MDW_LOGO_URL, (tex) => {
    if ("colorSpace" in tex && THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;

    tex.anisotropy = anisoUse;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;

    const iw = tex.image && "width" in tex.image ? (tex.image as HTMLImageElement).width : 1;
    const ih = tex.image && "height" in tex.image ? (tex.image as HTMLImageElement).height : 1;
    const aspect = iw / ih;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.98,
      depthTest: true,
      depthWrite: false,
    });

    const logoSprite = new THREE.Sprite(mat);

    if (aspect >= 1) logoSprite.scale.set(logoBaseSize * aspect, logoBaseSize, 1);
    else logoSprite.scale.set(logoBaseSize, logoBaseSize / aspect, 1);

    logoSprite.position.set(0, 0, 0);
    logoSprite.renderOrder = -10;
    sphereGroup.add(logoSprite);
  });

  const lightbox = makeLightboxOnce();
  const lbBase = lightbox.querySelector<HTMLImageElement>(".mdw-globe-lightbox__imgbase")!;
  const lbOverlay = lightbox.querySelector<HTMLImageElement>(".mdw-globe-lightbox__imgoverlay")!;
  lbBase.referrerPolicy = "no-referrer";
  lbOverlay.referrerPolicy = "no-referrer";
  const lbPrev = lightbox.querySelector(".mdw-globe-btn--prev")!;
  const lbNext = lightbox.querySelector(".mdw-globe-btn--next")!;
  const lbCounter = lightbox.querySelector(".mdw-globe-lightbox__counter")!;
  const lbCTA = lightbox.querySelector<HTMLAnchorElement>(".mdw-globe-btn--ctaLink")!;

  let currentIndex = 0;
  let isFading = false;

  function updateCTA(idx: number) {
    lbCounter.textContent = `Image ${String(idx + 1).padStart(2, "0")} / ${MDW_IMAGE_URLS.length}`;
    const cta = getCTAForIndex(idx);
    if (cta) {
      lbCTA.textContent = cta.label;
      lbCTA.href = cta.href;
      lbCTA.style.display = "inline-flex";
    } else {
      lbCTA.style.display = "none";
    }
  }

  function openLightboxByIndex(idx: number) {
    currentIndex = (idx + MDW_IMAGE_URLS.length) % MDW_IMAGE_URLS.length;
    updateCTA(currentIndex);
    lbOverlay.classList.remove("is-on");
    lbOverlay.removeAttribute("src");
    lbOverlay.hidden = true;
    lbBase.alt = "Gallery preview";
    lbBase.src = MDW_IMAGE_URLS[currentIndex];
    void lbBase.decode?.().catch(() => {});
    lightbox.classList.add("is-open");
  }

  function crossfadeTo(idx: number) {
    if (isFading) return;
    isFading = true;

    const nextIndex = (idx + MDW_IMAGE_URLS.length) % MDW_IMAGE_URLS.length;
    updateCTA(nextIndex);

    lbOverlay.classList.remove("is-on");
    lbOverlay.hidden = false;
    lbOverlay.src = MDW_IMAGE_URLS[nextIndex];

    const beginFadeIn = () => {
      requestAnimationFrame(() => lbOverlay.classList.add("is-on"));
      const done = () => {
        lbBase.src = MDW_IMAGE_URLS[nextIndex];
        lbOverlay.classList.remove("is-on");
        lbOverlay.removeAttribute("src");
        lbOverlay.hidden = true;
        currentIndex = nextIndex;
        isFading = false;
      };
      lbOverlay.addEventListener("transitionend", done, { once: true });
    };

    if (typeof lbOverlay.decode === "function") {
      void lbOverlay.decode().then(beginFadeIn).catch(beginFadeIn);
    } else if (lbOverlay.complete) {
      beginFadeIn();
    } else {
      lbOverlay.onload = () => beginFadeIn();
    }
  }

  function nextImg() {
    crossfadeTo(currentIndex + 1);
  }
  function prevImg() {
    crossfadeTo(currentIndex - 1);
  }

  lbNext.addEventListener("click", nextImg);
  lbPrev.addEventListener("click", prevImg);

  const onLbKey = (e: KeyboardEvent) => {
    if (!lightbox.classList.contains("is-open")) return;
    if (e.key === "ArrowRight") nextImg();
    if (e.key === "ArrowLeft") prevImg();
    if (e.key === "Escape") lightbox.classList.remove("is-open");
  };
  window.addEventListener("keydown", onLbKey);

  let x0 = 0,
    y0 = 0,
    touching = false;
  const imgWrap = lightbox.querySelector(".mdw-globe-lightbox__imgwrap") as HTMLElement;

  const onTouchStart = (e: Event) => {
    const te = e as TouchEvent;
    if (!te.touches?.[0]) return;
    touching = true;
    x0 = te.touches[0].clientX;
    y0 = te.touches[0].clientY;
  };
  const onTouchEnd = (e: Event) => {
    const te = e as TouchEvent;
    if (!touching) return;
    touching = false;
    const t = te.changedTouches?.[0];
    if (!t) return;
    const dx = t.clientX - x0;
    const dy = t.clientY - y0;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      if (dx < 0) nextImg();
      else prevImg();
    }
  };
  imgWrap.addEventListener("touchstart", onTouchStart, { passive: true });
  imgWrap.addEventListener("touchend", onTouchEnd, { passive: true });
  disposers.push(() => imgWrap.removeEventListener("touchstart", onTouchStart));
  disposers.push(() => imgWrap.removeEventListener("touchend", onTouchEnd));

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const clickableMeshes: THREE.Mesh[] = [];

  function setNDCFromClient(clientX: number, clientY: number) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -(((clientY - rect.top) / rect.height) * 2 - 1);
  }

  const allImageLink = shuffledArray(MDW_IMAGE_URLS);

  const texLoader = new THREE.TextureLoader();
  texLoader.setCrossOrigin("anonymous");

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const anisoUseImg = Math.min(maxAniso, isTouchDevice() ? 4 : 12);

  for (let i = 0; i < totalItems; i++) {
    const u = (i + 0.5) / totalItems;
    const y = 1 - 2 * u;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * goldenAngle;

    const x = Math.cos(theta) * r;
    const z = Math.sin(theta) * r;

    const imgSrc = allImageLink[i % allImageLink.length];

    texLoader.load(imgSrc, (texture) => {
      if ("colorSpace" in texture && THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;

      texture.anisotropy = anisoUseImg;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = true;
      texture.needsUpdate = true;

      const iw = texture.image && "width" in texture.image ? (texture.image as HTMLImageElement).width : 1;
      const ih = texture.image && "height" in texture.image ? (texture.image as HTMLImageElement).height : 1;
      const imageRatio = iw / ih;

      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

      let scale: number;
      if (imageRatio > planeRatio) {
        scale = planeRatio / imageRatio;
        texture.repeat.set(scale, 1);
        texture.offset.set((1 - scale) / 2, 0);
      } else {
        scale = imageRatio / planeRatio;
        texture.repeat.set(1, scale);
        texture.offset.set(0, (1 - scale) / 2);
      }

      const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
      const material = new THREE.MeshLambertMaterial({ map: texture, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.userData.src = imgSrc;
      mesh.position.set(x * sphereRadius, y * sphereRadius, z * sphereRadius);

      mesh.lookAt(mesh.position.clone().multiplyScalar(2));
      mesh.rotateY(Math.PI);

      sphereGroup.add(mesh);
      clickableMeshes.push(mesh);
    });
  }

  let isDragging = false;
  let lastX = 0,
    lastY = 0;
  let velX = 0,
    velY = 0;

  const autoRotateEnabled = getCSS(container, "--auto-rotate", "false") === "true";
  const autoRotateSpeedRaw = parseFloat(getCSS(container, "--auto-rotate-speed", "4"));
  const autoSpeed = (autoRotateSpeedRaw / 5000) * MDW_AUTO_SPEED_MULTIPLIER;

  function applyDrag(dx: number, dy: number) {
    const rotSpeed = 0.006;
    const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * rotSpeed);
    const qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * rotSpeed);
    sphereGroup.quaternion.premultiply(qy);
    sphereGroup.quaternion.premultiply(qx);
    velX = dx * rotSpeed;
    velY = dy * rotSpeed;
  }

  const dom = renderer.domElement;

  if (isTouchDevice()) {
    const onTouchStartCanvas = (e: Event) => {
      const te = e as TouchEvent;
      if (!te.touches?.[0]) return;
      isDragging = true;
      lastX = te.touches[0].clientX;
      lastY = te.touches[0].clientY;
    };
    const onTouchMoveCanvas = (e: Event) => {
      const te = e as TouchEvent;
      if (!isDragging || !te.touches?.[0]) return;
      te.preventDefault();
      const x = te.touches[0].clientX;
      const y = te.touches[0].clientY;
      applyDrag(x - lastX, y - lastY);
      lastX = x;
      lastY = y;
    };
    const onTouchEndCanvas = () => {
      isDragging = false;
    };
    const onTouchEndCanvasTap = (e: Event) => {
      const te = e as TouchEvent;
      if (!te.changedTouches?.[0]) return;
      const t = te.changedTouches[0];
      setNDCFromClient(t.clientX, t.clientY);
      raycaster.setFromCamera(ndc, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits?.length) {
        const src = (hits[0].object as THREE.Mesh).userData.src as string;
        const idx = MDW_IMAGE_URLS.indexOf(src);
        if (idx >= 0) openLightboxByIndex(idx);
      }
    };

    dom.addEventListener("touchstart", onTouchStartCanvas, { passive: true });
    dom.addEventListener("touchmove", onTouchMoveCanvas, { passive: false });
    dom.addEventListener("touchend", onTouchEndCanvas, { passive: true });
    dom.addEventListener("touchend", onTouchEndCanvasTap, { passive: true });
    disposers.push(() => dom.removeEventListener("touchstart", onTouchStartCanvas));
    disposers.push(() => dom.removeEventListener("touchmove", onTouchMoveCanvas));
    disposers.push(() => dom.removeEventListener("touchend", onTouchEndCanvas));
    disposers.push(() => dom.removeEventListener("touchend", onTouchEndCanvasTap));
  } else {
    let pointerDown = false;
    let downX = 0,
      downY = 0;
    let dragged = false;

    const onPointerDown = (e: PointerEvent) => {
      pointerDown = true;
      dragged = false;
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerDown) return;
      const dxT = e.clientX - downX;
      const dyT = e.clientY - downY;
      if (!dragged && (Math.abs(dxT) > 6 || Math.abs(dyT) > 6)) dragged = true;
      if (dragged) {
        applyDrag(e.clientX - lastX, e.clientY - lastY);
        lastX = e.clientX;
        lastY = e.clientY;
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      pointerDown = false;
      if (!dragged) {
        setNDCFromClient(e.clientX, e.clientY);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(clickableMeshes, false);
        if (hits?.length) {
          const src = (hits[0].object as THREE.Mesh).userData.src as string;
          const idx = MDW_IMAGE_URLS.indexOf(src);
          if (idx >= 0) openLightboxByIndex(idx);
        }
      }
    };

    dom.addEventListener("pointerdown", onPointerDown, { passive: true });
    dom.addEventListener("pointermove", onPointerMove, { passive: true });
    dom.addEventListener("pointerup", onPointerUp, { passive: true });
    disposers.push(() => dom.removeEventListener("pointerdown", onPointerDown));
    disposers.push(() => dom.removeEventListener("pointermove", onPointerMove));
    disposers.push(() => dom.removeEventListener("pointerup", onPointerUp));
  }

  function animate() {
    c.__raf = requestAnimationFrame(animate);

    (stars.material as THREE.ShaderMaterial).uniforms.uTime.value = performance.now() / 1000;
    stars.points.rotation.y += 0.00016;
    stars.points.rotation.x += 0.00005;

    if (!isDragging) {
      sphereGroup.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), velX));
      sphereGroup.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), velY));
      velX *= 0.92;
      velY *= 0.92;
    }

    if (autoRotateEnabled && !isDragging) {
      sphereGroup.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), autoSpeed));
    }

    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    ensureHasSize(container);
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / Math.max(h, 1);
    applyDesktopSizing();
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", onResize);
  disposers.push(() => window.removeEventListener("resize", onResize));
  disposers.push(() => window.removeEventListener("keydown", onLbKey));

  return () => {
    if (c.__raf) cancelAnimationFrame(c.__raf);
    c.__raf = undefined;
    disposers.forEach((d) => d());
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    c.__mdwInited = false;
  };
}
