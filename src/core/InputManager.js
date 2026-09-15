export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      handbrake: false,
      nitro: false,
      jump: false,
      horn: false
    };

    this.listeners = {
      changeCamera: [],
      toggleLights: [],
      resetCar: [],
      selectCar: [],
      enterExitVehicle: [],
      toggleMap: [],
      hornStart: [],
      hornEnd: []
    };

    this.keyElements = {};
    this.cacheKeyElements();
    this.setupClickableKeys();

    // Listen on window and document with high priority
    window.addEventListener('keydown', (e) => this.onKeyDown(e), { capture: true });
    window.addEventListener('keyup', (e) => this.onKeyUp(e), { capture: true });
  }

  cacheKeyElements() {
    ['W', 'A', 'S', 'D', 'SPACE', 'F', 'C', 'M'].forEach(key => {
      const el = document.querySelector(`.hud-key[data-key="${key}"]`);
      if (el) this.keyElements[key] = el;
    });
  }

  setupClickableKeys() {
    ['W', 'A', 'S', 'D', 'SPACE', 'F', 'M', 'C'].forEach(key => {
      const el = document.querySelector(`.hud-key[data-key="${key}"]`);
      if (el) {
        el.style.cursor = 'pointer';

        const onPress = (e) => {
          if (e) e.preventDefault();
          if (key === 'W') this.keys.forward = true;
          if (key === 'S') this.keys.backward = true;
          if (key === 'A') this.keys.left = true;
          if (key === 'D') this.keys.right = true;
          if (key === 'SPACE') { this.keys.handbrake = true; this.keys.jump = true; }
          if (key === 'F') this.trigger('enterExitVehicle');
          if (key === 'M') this.trigger('toggleMap');
          if (key === 'C') this.trigger('changeCamera');
          this.setKeyVisual(key, true);
        };

        const onRelease = (e) => {
          if (e) e.preventDefault();
          if (key === 'W') this.keys.forward = false;
          if (key === 'S') this.keys.backward = false;
          if (key === 'A') this.keys.left = false;
          if (key === 'D') this.keys.right = false;
          if (key === 'SPACE') { this.keys.handbrake = false; this.keys.jump = false; }
          this.setKeyVisual(key, false);
        };

        el.addEventListener('mousedown', onPress);
        el.addEventListener('mouseup', onRelease);
        el.addEventListener('mouseleave', onRelease);

        el.addEventListener('touchstart', onPress, { passive: false });
        el.addEventListener('touchend', onRelease, { passive: false });
        el.addEventListener('touchcancel', onRelease, { passive: false });
      }
    });
  }

  setKeyVisual(key, active) {
    if (!this.keyElements[key]) {
      this.cacheKeyElements();
    }
    if (this.keyElements[key]) {
      if (active) this.keyElements[key].classList.add('pressed');
      else this.keyElements[key].classList.remove('pressed');
    }
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  onKeyDown(e) {
    // If the auth modal is visible and typing in input, don't interfere
    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay && !authOverlay.classList.contains('hidden')) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
    }

    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';

    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w') {
      this.keys.forward = true;
      this.setKeyVisual('W', true);
      if (code.startsWith('Arrow')) e.preventDefault();
    }
    if (code === 'KeyS' || code === 'ArrowDown' || key === 's') {
      this.keys.backward = true;
      this.setKeyVisual('S', true);
      if (code.startsWith('Arrow')) e.preventDefault();
    }
    if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
      this.keys.left = true;
      this.setKeyVisual('A', true);
      if (code.startsWith('Arrow')) e.preventDefault();
    }
    if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
      this.keys.right = true;
      this.setKeyVisual('D', true);
      if (code.startsWith('Arrow')) e.preventDefault();
    }
    if (code === 'Space' || key === ' ') {
      this.keys.handbrake = true;
      this.keys.jump = true;
      this.setKeyVisual('SPACE', true);
      e.preventDefault();
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
      this.keys.nitro = true;
    }
    if (code === 'KeyF' || key === 'f') {
      this.setKeyVisual('F', true);
      this.trigger('enterExitVehicle');
    }
    if (code === 'KeyM' || key === 'm') {
      this.setKeyVisual('M', true);
      this.trigger('toggleMap');
    }
    if (code === 'KeyC' || key === 'c') {
      this.setKeyVisual('C', true);
      this.trigger('changeCamera');
    }
    if (code === 'KeyL' || key === 'l') {
      this.trigger('toggleLights');
    }
    if (code === 'KeyR' || key === 'r') {
      this.trigger('resetCar');
    }
    if (code === 'KeyH' || key === 'h') {
      if (!this.keys.horn) {
        this.keys.horn = true;
        this.trigger('hornStart');
      }
    }

    if (code === 'Digit1' || key === '1') this.trigger('selectCar', 0);
    if (code === 'Digit2' || key === '2') this.trigger('selectCar', 1);
    if (code === 'Digit3' || key === '3') this.trigger('selectCar', 2);
    if (code === 'Digit4' || key === '4') this.trigger('selectCar', 3);
  }

  onKeyUp(e) {
    const authOverlay = document.getElementById('auth-overlay');
    if (authOverlay && !authOverlay.classList.contains('hidden')) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
        return;
      }
    }

    const code = e.code;
    const key = e.key ? e.key.toLowerCase() : '';

    if (code === 'KeyW' || code === 'ArrowUp' || key === 'w') {
      this.keys.forward = false;
      this.setKeyVisual('W', false);
    }
    if (code === 'KeyS' || code === 'ArrowDown' || key === 's') {
      this.keys.backward = false;
      this.setKeyVisual('S', false);
    }
    if (code === 'KeyA' || code === 'ArrowLeft' || key === 'a') {
      this.keys.left = false;
      this.setKeyVisual('A', false);
    }
    if (code === 'KeyD' || code === 'ArrowRight' || key === 'd') {
      this.keys.right = false;
      this.setKeyVisual('D', false);
    }
    if (code === 'Space' || key === ' ') {
      this.keys.handbrake = false;
      this.keys.jump = false;
      this.setKeyVisual('SPACE', false);
    }
    if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') {
      this.keys.nitro = false;
    }
    if (code === 'KeyF' || key === 'f') {
      this.setKeyVisual('F', false);
    }
    if (code === 'KeyM' || key === 'm') {
      this.setKeyVisual('M', false);
    }
    if (code === 'KeyC' || key === 'c') {
      this.setKeyVisual('C', false);
    }
    if (code === 'KeyH' || key === 'h') {
      this.keys.horn = false;
      this.trigger('hornEnd');
    }
  }
}
