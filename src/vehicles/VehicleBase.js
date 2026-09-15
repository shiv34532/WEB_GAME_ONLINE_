import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CarModels } from './CarModels.js';

export class VehicleBase {
  constructor(scene, physicsWorld, particleSystem, type = 'supercar', city = null) {
    this.scene = scene;
    this.physics = physicsWorld;
    this.particles = particleSystem;
    this.type = type;
    this.city = city;

    this.wheelMeshes = [];
    this.wheelSteerPivots = [];
    this.wheelSpinGroups = [];
    this.wheelOffsets = [];

    this.isHeadlightsOn = true;
    this.speedKmh = 0;
    this.currentGear = 1;
    this.rpm = 900;
    this.isDrifting = false;
    this.driftScore = 0;

    // Grounded kinematic state (always upright, never flips or drops)
    this.posX = 0;
    this.posZ = 0;
    this.groundY = 0.38;
    this.headingAngle = 0; // 0 = facing +Z
    this.speed = 0;        // forward > 0, reverse < 0 (m/s)
    this.steerAngle = 0;   // radians
    this.wheelRotation = 0;

    this.config = this.getCarConfig(type);
    this.initVisuals();
    this.initPhysics();
  }

  getCarConfig(type) {
    switch (type) {
      case 'muscle':
        return {
          mass: 1600,
          maxSpeed: 62, // ~223 km/h
          reverseMaxSpeed: 16,
          accel: 30,
          brake: 50,
          friction: 4.8,
          steerSpeed: 3.5,
          maxSteer: 0.58,
          wheelRadius: 0.38,
          chassisExtents: new CANNON.Vec3(1.0, 0.45, 2.2)
        };
      case 'sedan':
        return {
          mass: 1500,
          maxSpeed: 58, // ~210 km/h
          reverseMaxSpeed: 14,
          accel: 28,
          brake: 52,
          friction: 5.2,
          steerSpeed: 3.6,
          maxSteer: 0.62,
          wheelRadius: 0.36,
          chassisExtents: new CANNON.Vec3(0.95, 0.42, 2.3)
        };
      case 'suv':
        return {
          mass: 2100,
          maxSpeed: 52, // ~187 km/h
          reverseMaxSpeed: 12,
          accel: 25,
          brake: 46,
          friction: 5.0,
          steerSpeed: 3.0,
          maxSteer: 0.52,
          wheelRadius: 0.44,
          chassisExtents: new CANNON.Vec3(1.1, 0.55, 2.3)
        };
      case 'supercar':
      default:
        return {
          mass: 1350,
          maxSpeed: 75, // ~270 km/h
          reverseMaxSpeed: 18,
          accel: 38,
          brake: 56,
          friction: 5.4,
          steerSpeed: 4.0,
          maxSteer: 0.64,
          wheelRadius: 0.35,
          chassisExtents: new CANNON.Vec3(0.95, 0.38, 2.15)
        };
    }
  }

  initVisuals() {
    this.materials = CarModels.createMaterials();

    let carData;
    if (this.type === 'muscle') carData = CarModels.buildMuscle(this.materials);
    else if (this.type === 'sedan') carData = CarModels.buildSedan(this.materials);
    else if (this.type === 'suv') carData = CarModels.buildSUV(this.materials);
    else carData = CarModels.buildSupercar(this.materials);

    // Root Group: strictly rotated on Y axis (headingAngle), never tilts upside-down
    this.rootGroup = new THREE.Group();
    this.rootGroup.position.set(this.posX, this.groundY, this.posZ);
    this.rootGroup.rotation.order = 'YXZ';
    this.rootGroup.rotation.set(0, this.headingAngle, 0);

    // Backward-compatible alias
    this.bodyMesh = this.rootGroup;

    // Body container for subtle suspension roll/pitch
    this.modelContainer = new THREE.Group();
    this.modelContainer.add(carData.mesh);
    this.rootGroup.add(this.modelContainer);

    this.headlights = carData.headlights;
    this.taillights = carData.taillights;
    this.spotLights = carData.spotLights;

    // 4 Visual Wheel Meshes directly parented to the vehicle chassis
    const cfg = this.config;
    const wheelPositions = [
      { x: -0.92, y: cfg.wheelRadius, z: 1.4, isFront: true },   // Front Left
      { x: 0.92, y: cfg.wheelRadius, z: 1.4, isFront: true },    // Front Right
      { x: -0.92, y: cfg.wheelRadius, z: -1.4, isFront: false }, // Rear Left
      { x: 0.92, y: cfg.wheelRadius, z: -1.4, isFront: false }   // Rear Right
    ];

    this.wheelOffsets = wheelPositions;

    for (let i = 0; i < 4; i++) {
      const wp = wheelPositions[i];

      // Steer Pivot Group (handles steering left/right)
      const steerPivot = new THREE.Group();
      steerPivot.position.set(wp.x, wp.y, wp.z);

      // Spin Group (handles rolling forward/reverse)
      const spinGroup = new THREE.Group();
      const wheelMesh = CarModels.createWheelMesh(cfg.wheelRadius, 0.28, this.materials);
      spinGroup.add(wheelMesh);

      steerPivot.add(spinGroup);
      this.rootGroup.add(steerPivot);

      this.wheelSteerPivots.push(steerPivot);
      this.wheelSpinGroups.push(spinGroup);
      this.wheelMeshes.push(wheelMesh);
    }

    this.scene.add(this.rootGroup);
  }

  initPhysics() {
    const cfg = this.config;

    // Kinematic Chassis Body in Cannon-es: stays grounded, provides obstacle collision
    const chassisShape = new CANNON.Box(cfg.chassisExtents);
    this.chassisBody = new CANNON.Body({
      type: CANNON.Body.KINEMATIC,
      mass: 0,
      position: new CANNON.Vec3(this.posX, this.groundY, this.posZ)
    });
    this.chassisBody.addShape(chassisShape);

    this.physics.world.addBody(this.chassisBody);
  }

  toggleHeadlights() {
    this.isHeadlightsOn = !this.isHeadlightsOn;
    this.spotLights.forEach(spot => {
      spot.intensity = this.isHeadlightsOn ? 2.5 : 0;
    });
    this.headlights.forEach(hl => {
      hl.material = this.isHeadlightsOn ? this.materials.headlightOn : this.materials.headlightOff;
    });
    return this.isHeadlightsOn;
  }

  applyBrakes(isBraking) {
    this.taillights.forEach(tl => {
      tl.material = isBraking ? this.materials.brakeLightBright : (this.isHeadlightsOn ? this.materials.taillightOn : this.materials.taillightOff);
    });
  }

  resetPosition(x = 0, y = 0.38, z = 0, heading = 0) {
    this.posX = x;
    this.posZ = z;
    this.groundY = y;
    this.headingAngle = heading;
    this.speed = 0;
    this.steerAngle = 0;
    this.wheelRotation = 0;

    this.rootGroup.position.set(this.posX, this.groundY, this.posZ);
    this.rootGroup.rotation.set(0, this.headingAngle, 0);
    this.modelContainer.rotation.set(0, 0, 0);

    this.chassisBody.position.set(this.posX, this.groundY, this.posZ);
    this.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.headingAngle);
  }

  update(inputKeys, delta) {
    const cfg = this.config;

    // 1. Steering Dynamics (Left: A, Right: D)
    let targetSteer = 0;
    // In Three.js: Left is negative X, Right is positive X
    if (inputKeys.left) targetSteer -= cfg.maxSteer;
    if (inputKeys.right) targetSteer += cfg.maxSteer;

    // Smooth steering interpolation
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, delta * cfg.steerSpeed);

    // Speed-dependent steering stability (less sharp at top speeds)
    const speedRatio = Math.min(1.0, Math.abs(this.speed) / cfg.maxSpeed);
    const speedFactor = Math.max(0.32, 1.0 - speedRatio * 0.65);

    // 2. Throttle & Braking (Forward: W, Brake/Reverse: S)
    let isBraking = false;
    const accelRate = inputKeys.nitro ? cfg.accel * 1.4 : cfg.accel;

    if (inputKeys.forward) {
      if (this.speed < -0.3) {
        // Active foot brake while in reverse
        this.speed += cfg.brake * delta;
        if (this.speed > 0) this.speed = 0;
        isBraking = true;
      } else {
        // Accelerate forward with responsive torque curve
        const torque = Math.max(0.25, 1.0 - (this.speed / cfg.maxSpeed));
        this.speed += accelRate * torque * delta;
        if (this.speed > cfg.maxSpeed) this.speed = cfg.maxSpeed;
      }
    } else if (inputKeys.backward) {
      if (this.speed > 0.5) {
        // Active foot brake while moving forward
        this.speed -= cfg.brake * delta;
        if (this.speed < 0) this.speed = 0;
        isBraking = true;
      } else {
        // Smooth reverse gear
        this.speed -= (cfg.accel * 0.65) * delta;
        if (this.speed < -cfg.reverseMaxSpeed) this.speed = -cfg.reverseMaxSpeed;
      }
    } else {
      // Natural rolling deceleration (coasting friction)
      if (Math.abs(this.speed) > 0.1) {
        const sign = Math.sign(this.speed);
        this.speed -= sign * cfg.friction * delta;
        if (Math.sign(this.speed) !== sign) this.speed = 0;
      } else {
        this.speed = 0;
      }
    }

    // 3. Handbrake / Drifting (SPACE)
    if (inputKeys.handbrake) {
      isBraking = true;
      this.speed *= Math.pow(0.96, delta * 60);
      this.isDrifting = Math.abs(this.speed) > 6;
    } else {
      this.isDrifting = (Math.abs(this.steerAngle) > 0.35 && Math.abs(this.speed) > 13);
    }

    this.applyBrakes(isBraking);

    // 4. Update Heading Angle based on Speed & Steering
    if (Math.abs(this.speed) > 0.15) {
      const dirSign = this.speed >= 0 ? 1 : -1;
      const driftMult = this.isDrifting ? 1.7 : 1.0;
      const turnDelta = this.steerAngle * dirSign * driftMult * (Math.abs(this.speed) / 14) * delta * 3.8 * speedFactor;
      this.headingAngle += turnDelta;
    }

    // 5. Kinematic Position Integration & Collision Check
    const forwardX = Math.sin(this.headingAngle);
    const forwardZ = Math.cos(this.headingAngle);

    const stepX = forwardX * this.speed * delta;
    const stepZ = forwardZ * this.speed * delta;

    const nextX = this.posX + stepX;
    const nextZ = this.posZ + stepZ;

    // Check collision with city buildings and world borders
    let collided = false;
    if (this.city && this.city.checkCollision) {
      collided = this.city.checkCollision(nextX, nextZ, 1.8);
    } else {
      if (Math.abs(nextX) > 575 || Math.abs(nextZ) > 575) collided = true;
    }

    if (!collided) {
      this.posX = nextX;
      this.posZ = nextZ;
    } else {
      // Rebound gently on collision
      this.speed = -this.speed * 0.25;
    }

    // Ground elevation locked on road
    this.groundY = 0.38;

    // Synchronize 3D Vehicle Root Group (strictly Y-up)
    this.rootGroup.position.set(this.posX, this.groundY, this.posZ);
    this.rootGroup.rotation.set(0, this.headingAngle, 0);

    // Subtle chassis roll & pitch on inner container (strictly bounded)
    const rollAngle = (this.steerAngle) * (Math.abs(this.speed) / cfg.maxSpeed) * 0.08;
    const pitchAngle = isBraking ? -0.03 : (inputKeys.forward ? 0.02 : 0);
    this.modelContainer.rotation.z = THREE.MathUtils.lerp(this.modelContainer.rotation.z, rollAngle, delta * 8);
    this.modelContainer.rotation.x = THREE.MathUtils.lerp(this.modelContainer.rotation.x, pitchAngle, delta * 8);

    // 6. Update Visual Wheel Meshes
    const spinDelta = (this.speed / cfg.wheelRadius) * delta;
    this.wheelRotation += spinDelta;

    // Front wheels steer (indices 0 and 1)
    this.wheelSteerPivots[0].rotation.y = this.steerAngle;
    this.wheelSteerPivots[1].rotation.y = this.steerAngle;

    // All wheels roll around their axle
    for (let i = 0; i < 4; i++) {
      this.wheelSpinGroups[i].rotation.x = this.wheelRotation;
    }

    // Drift Smoke Particle Generation at rear wheels
    if (this.isDrifting && this.particles) {
      this.rootGroup.updateMatrixWorld();
      const rearL = new THREE.Vector3(-0.92, 0.2, -1.4).applyMatrix4(this.rootGroup.matrixWorld);
      const rearR = new THREE.Vector3(0.92, 0.2, -1.4).applyMatrix4(this.rootGroup.matrixWorld);
      const vel = new THREE.Vector3(stepX / (delta || 0.016), 0, stepZ / (delta || 0.016));
      this.particles.emit(rearL, vel);
      this.particles.emit(rearR, vel);
    }

    // Keep Cannon kinematic body in sync
    this.chassisBody.position.set(this.posX, this.groundY, this.posZ);
    this.chassisBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), this.headingAngle);

    // 7. Calculate Speed in KM/H
    this.speedKmh = Math.abs(Math.round(this.speed * 3.6));

    // 8. Gears & RPM
    this.updateGearsAndRpm();

    // 9. Drift Scoring
    if (this.isDrifting) {
      this.driftScore += Math.round(this.speedKmh * delta * 12);
    }
  }

  updateGearsAndRpm() {
    const spd = Math.abs(this.speedKmh);
    if (this.speed < -0.5) {
      this.currentGear = 'R';
      this.rpm = Math.min(6200, 1200 + spd * 140);
      return;
    }

    if (spd < 1) {
      this.currentGear = 1;
      this.rpm = 900;
      return;
    }

    const gearRatios = [0, 45, 80, 125, 175, 230, 320];
    let gear = 1;
    for (let g = 1; g < gearRatios.length - 1; g++) {
      if (spd >= gearRatios[g]) {
        gear = g + 1;
      }
    }
    this.currentGear = gear;

    const minSpd = gearRatios[gear - 1];
    const maxSpd = gearRatios[gear];
    const ratio = Math.min(1.0, Math.max(0, (spd - minSpd) / (maxSpd - minSpd)));
    this.rpm = Math.floor(2200 + ratio * 5600);
  }

  destroy() {
    this.scene.remove(this.rootGroup);
    this.physics.world.removeBody(this.chassisBody);
  }
}
