import * as THREE from 'three';
import { Renderer } from './core/Renderer.js';
import { CameraManager } from './core/CameraManager.js';
import { PhysicsWorld } from './core/PhysicsWorld.js';
import { InputManager } from './core/InputManager.js';
import { SoundEngine } from './core/SoundEngine.js';
import { SkyAtmosphere } from './world/SkyAtmosphere.js';
import { CityBuilder } from './world/CityBuilder.js';
import { Minimap } from './world/Minimap.js';
import { VehicleBase } from './vehicles/VehicleBase.js';
import { ParticleSystem } from './vehicles/ParticleSystem.js';
import { PedestrianManager } from './npcs/PedestrianManager.js';
import { PlayerController } from './characters/PlayerController.js';
import { HUD } from './ui/HUD.js';

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.clock = new THREE.Clock();

    // 1. Core Systems
    this.renderer = new Renderer(this.container);
    this.cameraMgr = new CameraManager();
    this.physics = new PhysicsWorld();
    this.inputs = new InputManager();
    this.sounds = new SoundEngine();

    // 2. World & Environment
    this.sky = new SkyAtmosphere(this.renderer.scene);
    this.city = new CityBuilder(this.renderer.scene, this.physics);
    this.particles = new ParticleSystem(this.renderer.scene, 120);

    // 3. Vehicles & Player
    this.currentCarType = 'supercar';
    this.vehicle = new VehicleBase(
      this.renderer.scene,
      this.physics,
      this.particles,
      this.currentCarType,
      this.city
    );
    this.vehicle.resetPosition(0, 0.38, 0, 0);

    // GTA Player Controller (Starts inside car ready to drive!)
    this.player = new PlayerController(
      this.renderer.scene,
      new THREE.Vector3(-2.2, 0.2, 0)
    );
    this.player.mode = 'in_car';
    this.player.currentVehicle = this.vehicle;
    this.player.group.visible = false;

    // 4. Role-Based Pedestrians (Civilians, Police, Business Travelers)
    this.pedestrians = new PedestrianManager(
      this.renderer.scene,
      this.city.sidewalkWaypoints,
      40
    );

    // 5. UI & Radar
    const minimapCanvas = document.getElementById('minimap-canvas');
    this.minimap = new Minimap(minimapCanvas, this.city);
    this.hud = new HUD();

    this.districtBadge = document.getElementById('district-badge');
    this.playerModeBadge = document.getElementById('player-mode-badge');

    // 6. Connect Input & UI Events
    this.setupEvents();

    // 7. Start Game Loop Immediately
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  setupEvents() {
    // Unlock Web Audio on first interaction
    const unlockAudio = () => {
      this.sounds.init();
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('keydown', unlockAudio, { once: true });
    window.addEventListener('click', unlockAudio, { once: true });
    window.addEventListener('touchstart', unlockAudio, { once: true });

    // Focus window on container click
    this.container.addEventListener('click', () => {
      window.focus();
    });

    // Enter / Exit Vehicle (GTA Feature with Key F)
    this.inputs.on('enterExitVehicle', () => {
      this.player.toggleVehicle(this.vehicle);
    });

    // Toggle Fullscreen Map (Key M or Button)
    this.inputs.on('toggleMap', () => {
      this.minimap.toggleFullscreenMap();
    });

    // Fast travel teleport handler from GPS map
    this.minimap.onTeleport((target) => {
      if (this.player.mode === 'in_car') {
        this.vehicle.resetPosition(target.x, target.y, target.z, target.heading);
      } else {
        this.vehicle.resetPosition(target.x, target.y, target.z, target.heading);
        this.player.group.position.set(target.x - 2.2, 0.2, target.z);
      }
    });

    // Time of Day
    const timeSelect = document.getElementById('time-select');
    if (timeSelect) {
      timeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        this.sky.setTime(mode);
        this.city.setStreetLights(mode === 'night');
      });
    }

    // Graphics Quality
    const gfxSelect = document.getElementById('gfx-select');
    if (gfxSelect) {
      gfxSelect.addEventListener('change', (e) => {
        this.renderer.setGraphicsPreset(e.target.value);
      });
    }

    // Camera Cycle
    const btnCamera = document.getElementById('btn-camera');
    if (btnCamera) {
      const onCycleCam = () => {
        const mode = this.cameraMgr.cycleMode();
        btnCamera.textContent = mode.toUpperCase();
      };
      btnCamera.addEventListener('click', onCycleCam);
      this.inputs.on('changeCamera', onCycleCam);
    }

    // Headlights Toggle
    const btnLights = document.getElementById('btn-lights');
    if (btnLights) {
      const onToggleLights = () => {
        const isOn = this.vehicle.toggleHeadlights();
        btnLights.textContent = isOn ? 'ON' : 'OFF';
      };
      btnLights.addEventListener('click', onToggleLights);
      this.inputs.on('toggleLights', onToggleLights);
    }

    // Audio Mute Toggle
    const btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        const unmuted = this.sounds.toggleMute();
        btnAudio.textContent = unmuted ? '🔊' : '🔇';
      });
    }

    // Reset Vehicle
    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      const onReset = () => {
        this.vehicle.resetPosition(0, 0.38, 0, 0);
        if (this.player.mode === 'on_foot') {
          this.player.group.position.set(-2.2, 0.2, 0);
        }
      };
      btnReset.addEventListener('click', onReset);
      this.inputs.on('resetCar', onReset);
    }

    // Horn Sound & Scare Pedestrians
    this.inputs.on('hornStart', () => {
      this.sounds.startHorn();
      const activePos = this.player.mode === 'in_car' ? this.vehicle.bodyMesh.position : this.player.group.position;
      this.pedestrians.scareNearbyPedestrians(activePos, 32);
    });
    this.inputs.on('hornEnd', () => {
      this.sounds.stopHorn();
    });

    // Vehicle Switcher Drawer Buttons
    const carBtns = document.querySelectorAll('.car-btn');
    const carTypes = ['supercar', 'muscle', 'sedan', 'suv'];

    const switchCar = (index) => {
      const nextType = carTypes[index];
      if (nextType === this.currentCarType) return;

      carBtns.forEach((b, i) => {
        b.classList.toggle('active', i === index);
      });

      const currentX = this.vehicle.posX;
      const currentZ = this.vehicle.posZ;
      const currentHeading = this.vehicle.headingAngle;

      this.vehicle.destroy();
      this.currentCarType = nextType;
      this.vehicle = new VehicleBase(
        this.renderer.scene,
        this.physics,
        this.particles,
        nextType,
        this.city
      );
      this.vehicle.resetPosition(currentX, 0.38, currentZ, currentHeading);

      if (this.player.mode === 'in_car') {
        this.player.currentVehicle = this.vehicle;
      }
    };

    carBtns.forEach((btn, index) => {
      btn.addEventListener('click', () => switchCar(index));
    });

    this.inputs.on('selectCar', (index) => switchCar(index));
  }

  animate() {
    requestAnimationFrame(this.animate);

    const delta = Math.min(this.clock.getDelta(), 0.05);

    // 1. Physics Step
    this.physics.step(delta);

    // 2. Active Mode (In Car vs On Foot)
    const isFoot = (this.player.mode === 'on_foot');
    const activeMesh = isFoot ? this.player.group : this.vehicle.bodyMesh;
    const activePos = activeMesh.position;

    if (!isFoot) {
      // In Car Driving Mode
      this.vehicle.update(this.inputs.keys, delta);
      const rpmRatio = (this.vehicle.rpm - 900) / 7100;
      this.sounds.update(this.vehicle.speedKmh, rpmRatio, this.vehicle.isDrifting);
      this.cameraMgr.update(
        this.vehicle.bodyMesh,
        false,
        this.vehicle.speedKmh,
        delta,
        this.vehicle.headingAngle
      );

      if (this.playerModeBadge) {
        this.playerModeBadge.textContent = `🚗 IN CAR (${this.currentCarType.toUpperCase()})`;
        this.playerModeBadge.style.color = '#00f0ff';
      }
    } else {
      // On Foot Human Exploration Mode
      this.player.update(this.inputs.keys, delta, this.cameraMgr.camera, this.vehicle);
      this.sounds.update(0, 0.05, false);
      this.cameraMgr.update(
        this.player.group,
        true,
        0,
        delta,
        this.player.group.rotation.y
      );

      if (this.playerModeBadge) {
        this.playerModeBadge.textContent = '🚶 ON FOOT (HUMAN)';
        this.playerModeBadge.style.color = '#00ff96';
      }
    }

    // 3. Update Tire Smoke Particles
    this.particles.update(delta, this.cameraMgr.camera);

    // 4. Update Role-Based Pedestrians
    const activeSpeed = isFoot ? (this.inputs.keys.nitro ? 10 : 5) : this.vehicle.speedKmh;
    this.pedestrians.update(delta, activePos, activeSpeed);

    // 5. Update Sky & Shadows centered on player
    this.sky.update(activePos);

    // 6. Update District Name on HUD
    if (this.districtBadge) {
      this.districtBadge.textContent = this.city.getDistrictName(activePos);
    }

    // 7. Update Radar Minimap & Fullscreen GPS Map
    const activeHeading = isFoot ? this.player.group.rotation.y : this.vehicle.headingAngle;
    this.minimap.update(activePos, activeHeading, this.pedestrians.pedestrians, this.vehicle.bodyMesh.position);

    // 8. Update Speedometer / HUD
    this.hud.update(this.vehicle, this.vehicle.isHeadlightsOn);

    // 9. Render 3D Frame
    this.renderer.render(this.cameraMgr.camera);
  }
}

// Safe immediate bootstrap: launches game directly and immediately
function initGame() {
  if (!window.__apexGame) {
    window.__apexGame = new Game();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
