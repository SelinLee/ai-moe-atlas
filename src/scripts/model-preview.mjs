// Keep both the renderer bundle and the model off the network until deliberate activation.

let viewerModule;
const loadViewer = () => viewerModule ??= import('@google/model-viewer').catch(error => { viewerModule = undefined; throw error; });
const radians = (degrees) => degrees * Math.PI / 180;
const defaultOrbit = '0deg 78deg 105%';
const directions = ['left','right','front','back','upper-left','upper-right','upper-front','upper-back','lower-left','lower-right','lower-front','lower-back','interaction-prompt'];
const a11yLabels = {
  zh: ['左侧','右侧','正面','背面','左上方','右上方','正面上方','背面上方','左下方','右下方','正面下方','背面下方','可用鼠标、触屏或方向键转动模型。'],
  en: ['Left','Right','Front','Back','Upper left','Upper right','Upper front','Upper back','Lower left','Lower right','Lower front','Lower back','Use mouse, touch, or arrow keys to rotate.'],
  ja: ['左側','右側','正面','背面','左上','右上','正面の上','背面の上','左下','右下','正面の下','背面の下','マウス、タッチ、矢印キーで回転できます。'],
};
const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

export function supportsWebGL2() {
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    if (!context || context.isContextLost()) return false;
    // Release the small capability-check context before starting the real renderer.
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

export function initializeModelPreview(root, viewerLoader = loadViewer, graphicsAvailable = supportsWebGL2) {
  const messages = JSON.parse(root.dataset.messages);
  const stage = root.querySelector('.model-stage');
  const mount = root.querySelector('[data-model-mount]');
  const poster = root.querySelector('[data-model-poster]');
  const overlay = root.querySelector('[data-model-overlay]');
  const loadButton = root.querySelector('[data-model-load]');
  const loadLabel = root.querySelector('[data-model-load-label]');
  const status = root.querySelector('[data-model-status]');
  const controls = root.querySelector('[data-model-controls]');
  const help = root.querySelector('[data-model-help]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let viewer;
  let initialOrbit;
  let generation = 0;
  let failures = 0;
  let timeout;
  function updateMotion() {
    // Never autoplay or auto-rotate. Reduced-motion also removes camera interpolation.
    viewer?.setAttribute('interpolation-decay', reducedMotion.matches ? '0' : '65');
    if (reducedMotion.matches) viewer?.jumpCameraToGoal();
  }
  reducedMotion.addEventListener('change', updateMotion);
  function discardViewer() {
    clearTimeout(timeout);
    viewer?.remove();
    viewer = undefined;
    mount.replaceChildren();
    initialOrbit = undefined;
  }
  function showStill(message, state = 'idle') {
    generation++;
    discardViewer();
    root.dataset.state = state;
    stage.setAttribute('aria-busy', 'false');
    poster.hidden = false;
    overlay.hidden = false;
    controls.hidden = true;
    help.hidden = true;
    loadButton.disabled = false;
    loadLabel.textContent = state === 'error' ? messages.retry : messages.load;
    status.textContent = message;
  }
  async function activate() {
    if (root.dataset.state === 'loading' || root.dataset.state === 'ready') return;
    const attempt = ++generation;
    root.dataset.state = 'loading';
    loadButton.disabled = true;
    loadLabel.textContent = messages.loading;
    status.textContent = messages.loading;
    stage.setAttribute('aria-busy', 'true');
    const fail = (message = messages.error) => {
      if (attempt !== generation) return;
      failures++;
      showStill(message, 'error');
      loadButton.focus({ preventScroll: true });
    };
    // A lost connection or failed custom-element startup must not leave a spinner forever.
    timeout = setTimeout(() => fail(), 45000);
    try {
      // model-viewer can emit load for fetched geometry even when WebGL startup failed.
      if (!graphicsAvailable()) { fail(messages.unsupported ?? messages.error); return; }
      await viewerLoader();
      if (attempt !== generation) return;
      const element = document.createElement('model-viewer');
      viewer = element;
      element.setAttribute('alt', `${root.dataset.title}. ${root.dataset.description}`);
      element.setAttribute('aria-label', root.dataset.title);
      element.a11y = Object.fromEntries(directions.map((key,index) => [key,a11yLabels[root.dataset.lang][index]]));
      element.setAttribute('camera-controls', '');
      element.setAttribute('touch-action', 'pan-y');
      element.setAttribute('disable-pan', '');
      element.setAttribute('disable-tap', '');
      element.setAttribute('interaction-prompt', 'none');
      element.setAttribute('camera-orbit', defaultOrbit);
      element.setAttribute('min-camera-orbit', 'auto 15deg 45%');
      element.setAttribute('max-camera-orbit', 'auto 160deg 180%');
      element.setAttribute('shadow-intensity', '0.65');
      element.setAttribute('exposure', '1.05');
      element.setAttribute('loading', 'eager');
      element.setAttribute('reveal', 'auto');
      element.setAttribute('poster', root.dataset.poster);
      updateMotion();
      element.addEventListener('error', () => fail(), { once: true });
      element.addEventListener('load', () => {
        if (attempt !== generation) return;
        try {
          element.jumpCameraToGoal();
          initialOrbit = { ...element.getCameraOrbit() };
          if (![initialOrbit.theta, initialOrbit.phi, initialOrbit.radius].every(Number.isFinite) || initialOrbit.radius <= 0) { fail(); return; }
        } catch { fail(); return; }
        clearTimeout(timeout);
        root.dataset.state = 'ready';
        stage.setAttribute('aria-busy', 'false');
        poster.hidden = true;
        overlay.hidden = true;
        controls.hidden = false;
        help.hidden = false;
        status.textContent = messages.ready;
        // Preserve keyboard position when the activated button disappears.
        controls.querySelector('button')?.focus({ preventScroll: true });
      }, { once: true });
      mount.replaceChildren(element);
      // model-viewer caches failed GLTF loads too; a new local URL makes retry real.
      element.src = failures ? `${root.dataset.src}?previewRetry=${failures}` : root.dataset.src;
    } catch { fail(); }
  }
  overlay.hidden = false;
  loadButton.addEventListener('click', activate);
  controls.addEventListener('click', event => {
    const button = (event.target).closest('[data-model-action]');
    if (!button || !viewer || !initialOrbit || root.dataset.state !== 'ready') return;
    const action = button.dataset.modelAction;
    if (action === 'reset') {
      viewer.cameraOrbit = defaultOrbit;
      viewer.cameraTarget = 'auto auto auto';
      viewer.fieldOfView = 'auto';
      status.textContent = messages.resetDone;
    } else {
      const orbit = viewer.getCameraOrbit();
      const theta = orbit.theta + (action === 'left' ? -radians(22.5) : action === 'right' ? radians(22.5) : 0);
      const phi = clamp(orbit.phi + (action === 'up' ? -radians(15) : action === 'down' ? radians(15) : 0), radians(15), radians(160));
      const radius = clamp(orbit.radius * (action === 'in' ? .8 : action === 'out' ? 1.25 : 1), initialOrbit.radius * .45 / 1.05, initialOrbit.radius * 1.8 / 1.05);
      viewer.cameraOrbit = `${theta}rad ${phi}rad ${radius}m`;
      status.textContent = messages.moved;
    }
    if (reducedMotion.matches) viewer.jumpCameraToGoal();
  });
  root.querySelector('[data-model-unload]').addEventListener('click', () => {
    showStill(messages.posterDone);
    loadButton.focus({ preventScroll: true });
  });
  addEventListener('pagehide', () => showStill(messages.idle));
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-model-preview]').forEach(root => initializeModelPreview(root));
