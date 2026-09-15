import * as THREE from 'three';

export class CameraManager {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1500
    );

    this.modes = ['chase', 'hood', 'orbit', 'top'];
    this.currentModeIndex = 0;
    this.mode = this.modes[this.currentModeIndex];

    this.currentLook = new THREE.Vector3(0, 1, 0);

    // Orbit control states
    this.orbitAngleH = 0;
    this.orbitAngleV = 0.35;
    this.orbitDistance = 7;
    this.isMouseDown = false;
    this.prevMouse = { x: 0, y: 0 };

    this.setupOrbitListeners();
    window.addEventListener('resize', () => this.onResize());
  }

  setupOrbitListeners() {
    window.addEventListener('mousedown', (e) => {
      // Don't start 3D orbit drag if clicking on UI elements, buttons, minimap, or inputs
      if (
        e.target.closest('.toolbar') ||
        e.target.closest('.touch-controls') ||
        e.target.closest('.vehicle-switcher') ||
        e.target.closest('.minimap-container') ||
        e.target.closest('.map-modal') ||
        e.target.closest('.dashboard') ||
        e.target.tagName === 'BUTTON' ||
        e.target.tagName === 'SELECT' ||
        e.target.tagName === 'INPUT'
      ) {
        return;
      }
      this.isMouseDown = true;
      this.prevMouse = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;
        this.orbitAngleH -= dx * 0.005;
        this.orbitAngleV = Math.max(0.08, Math.min(Math.PI / 2.2, this.orbitAngleV + dy * 0.005));
        this.prevMouse = { x: e.clientX, y: e.clientY };
      }
    });

    window.addEventListener('wheel', (e) => {
      if (!e.target.closest('.map-modal')) {
        this.orbitDistance = Math.max(3.5, Math.min(35, this.orbitDistance + e.deltaY * 0.01));
      }
    }, { passive: true });
  }

  cycleMode() {
    this.currentModeIndex = (this.currentModeIndex + 1) % this.modes.length;
    this.mode = this.modes[this.currentModeIndex];
    return this.mode;
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
  }

  update(targetMesh, isFoot = false, speed = 0, delta = 0.016, headingAngle = 0) {
    if (!targetMesh) return;

    const targetPos = targetMesh.position;

    // 1. ON-FOOT THIRD-PERSON HUMAN FOLLOW CAMERA
    if (isFoot) {
      const charHeading = targetMesh.rotation.y;
      const baseDist = 4.4;
      const height = 1.9;

      const backX = -Math.sin(charHeading) * baseDist;
      const backZ = -Math.cos(charHeading) * baseDist;

      const desiredPos = new THREE.Vector3(
        targetPos.x + backX,
        Math.max(1.3, targetPos.y + height),
        targetPos.z + backZ
      );

      this.camera.position.lerp(desiredPos, delta * 10);

      const lookTarget = new THREE.Vector3(
        targetPos.x + Math.sin(charHeading) * 1.5,
        targetPos.y + 1.3,
        targetPos.z + Math.cos(charHeading) * 1.5
      );
      this.currentLook.lerp(lookTarget, delta * 12);
      this.camera.lookAt(this.currentLook);
      return;
    }

    // 2. VEHICLE CAMERA MODES
    // Dynamic FOV expands with speed for high-speed adrenaline
    const baseFov = 60;
    const speedRatio = Math.min(1.0, speed / 180);
    const targetFov = baseFov + speedRatio * 16;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, delta * 4);
    this.camera.updateProjectionMatrix();

    if (this.mode === 'chase') {
      const chaseDist = 6.8;
      const chaseHeight = 2.4;

      // Position camera cleanly behind car based on headingAngle
      const backX = -Math.sin(headingAngle) * chaseDist;
      const backZ = -Math.cos(headingAngle) * chaseDist;

      const desiredCamPos = new THREE.Vector3(
        targetPos.x + backX,
        Math.max(1.4, targetPos.y + chaseHeight),
        targetPos.z + backZ
      );

      const lerpSpeed = Math.min(1.0, delta * 8.5);
      this.camera.position.lerp(desiredCamPos, lerpSpeed);

      // Look slightly ahead of car hood
      const forwardX = Math.sin(headingAngle) * 3.5;
      const forwardZ = Math.cos(headingAngle) * 3.5;
      const desiredLook = new THREE.Vector3(
        targetPos.x + forwardX,
        Math.max(0.6, targetPos.y + 0.9),
        targetPos.z + forwardZ
      );

      this.currentLook.lerp(desiredLook, lerpSpeed * 1.2);
      this.camera.lookAt(this.currentLook);

    } else if (this.mode === 'hood') {
      // First-person bonnet / hood view
      const forwardX = Math.sin(headingAngle);
      const forwardZ = Math.cos(headingAngle);

      const camX = targetPos.x + forwardX * 0.9;
      const camY = Math.max(1.1, targetPos.y + 0.8);
      const camZ = targetPos.z + forwardZ * 0.9;

      this.camera.position.set(camX, camY, camZ);

      const lookX = targetPos.x + forwardX * 30;
      const lookZ = targetPos.z + forwardZ * 30;
      this.camera.lookAt(lookX, camY, lookZ);

    } else if (this.mode === 'orbit') {
      // 360 mouse draggable orbit view
      const x = Math.sin(this.orbitAngleH) * Math.cos(this.orbitAngleV) * this.orbitDistance;
      const y = Math.sin(this.orbitAngleV) * this.orbitDistance;
      const z = Math.cos(this.orbitAngleH) * Math.cos(this.orbitAngleV) * this.orbitDistance;

      const desiredPos = new THREE.Vector3(
        targetPos.x + x,
        Math.max(1.2, targetPos.y + y + 0.8),
        targetPos.z + z
      );

      this.camera.position.lerp(desiredPos, delta * 12);
      this.camera.lookAt(targetPos.x, targetPos.y + 0.9, targetPos.z);

    } else if (this.mode === 'top') {
      // Bird's eye aerial view
      const topPos = new THREE.Vector3(targetPos.x, targetPos.y + 35, targetPos.z - 15);
      this.camera.position.lerp(topPos, delta * 6);
      this.camera.lookAt(targetPos.x, targetPos.y, targetPos.z + 4);
    }
  }
}
