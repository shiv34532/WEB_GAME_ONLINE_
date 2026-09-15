import * as THREE from 'three';

export class PlayerController {
  constructor(scene, startPos = new THREE.Vector3(-2.2, 0.2, 0)) {
    this.scene = scene;
    this.mode = 'in_car'; // 'in_car' | 'on_foot'
    this.currentVehicle = null;

    // Speeds & Physics
    this.walkSpeed = 5.2;
    this.runSpeed = 10.5;
    this.jumpForce = 7.5;
    this.verticalVelocity = 0;
    this.isGrounded = true;
    this.animTime = 0;

    this.interactPrompt = document.getElementById('interact-prompt');

    this.buildCharacterMesh(startPos);
    // Starts inside the vehicle ready to drive!
    this.group.visible = false;
  }

  buildCharacterMesh(pos) {
    this.group = new THREE.Group();
    this.group.position.copy(pos);

    // Protagonist PBR Materials
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0x1a2e4c, roughness: 0.6 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.7 });
    const jeansMat = new THREE.MeshStandardMaterial({ color: 0x242d38, roughness: 0.8 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xf5d6b8, roughness: 0.6 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

    // Hips / Pelvis
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.85;
    this.group.add(this.pelvis);

    // Torso (casts shadow)
    const torsoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 0.24), jacketMat);
    torsoMesh.position.y = 0.28;
    torsoMesh.castShadow = true;
    this.pelvis.add(torsoMesh);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.42, 0.25), shirtMat);
    chestMesh.position.set(0, 0.26, 0.01);
    this.pelvis.add(chestMesh);

    // Head
    const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.24, 0.22), skinMat);
    headMesh.position.set(0, 0.68, 0);
    this.pelvis.add(headMesh);

    // Hair
    const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.24), hairMat);
    hairMesh.position.set(0, 0.82, 0);
    this.pelvis.add(hairMesh);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.15, 0.48, 0.15);
    const footGeo = new THREE.BoxGeometry(0.15, 0.1, 0.24);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.11, 0, 0);
    const legL = new THREE.Mesh(legGeo, jeansMat);
    legL.position.y = -0.24;
    const footL = new THREE.Mesh(footGeo, shoeMat);
    footL.position.set(0, -0.48, 0.04);
    this.leftLeg.add(legL);
    this.leftLeg.add(footL);
    this.pelvis.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.11, 0, 0);
    const legR = new THREE.Mesh(legGeo, jeansMat);
    legR.position.y = -0.24;
    const footR = new THREE.Mesh(footGeo, shoeMat);
    footR.position.set(0, -0.48, 0.04);
    this.rightLeg.add(legR);
    this.rightLeg.add(footR);
    this.pelvis.add(this.rightLeg);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.12, 0.45, 0.12);
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.28, 0.5, 0);
    const armL = new THREE.Mesh(armGeo, jacketMat);
    armL.position.y = -0.22;
    this.leftArm.add(armL);
    this.pelvis.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.28, 0.5, 0);
    const armR = new THREE.Mesh(armGeo, jacketMat);
    armR.position.y = -0.22;
    this.rightArm.add(armR);
    this.pelvis.add(this.rightArm);

    this.scene.add(this.group);
  }

  toggleVehicle(vehicle) {
    if (!vehicle) return this.mode;

    if (this.mode === 'in_car') {
      // 1. Exit vehicle cleanly onto the driver's side on the asphalt
      this.mode = 'on_foot';
      const heading = vehicle.headingAngle;

      // Driver side offset (left of car)
      const leftDirX = -Math.cos(heading);
      const leftDirZ = Math.sin(heading);

      const exitX = vehicle.posX + leftDirX * 2.3;
      const exitZ = vehicle.posZ + leftDirZ * 2.3;

      this.group.position.set(exitX, 0.2, exitZ);
      this.group.rotation.y = heading - Math.PI / 2;
      this.group.visible = true;

      vehicle.speed = 0;
      this.currentVehicle = null;

      if (this.interactPrompt) {
        this.interactPrompt.textContent = '[F] ENTER VEHICLE';
        this.interactPrompt.classList.add('visible');
      }
    } else {
      // 2. Enter vehicle if within 6.0 meters
      const carCenter = new THREE.Vector3(vehicle.posX, 0.2, vehicle.posZ);
      const dist = this.group.position.distanceTo(carCenter);

      if (dist < 6.0) {
        this.mode = 'in_car';
        this.currentVehicle = vehicle;
        this.group.visible = false;

        if (this.interactPrompt) {
          this.interactPrompt.classList.remove('visible');
        }
      }
    }
    return this.mode;
  }

  update(inputKeys, delta, camera, vehicle) {
    if (this.mode === 'in_car') {
      if (vehicle) {
        this.group.position.set(vehicle.posX, 0.2, vehicle.posZ);
      }
      return;
    }

    // ON-FOOT THIRD-PERSON MOVEMENT
    const speed = inputKeys.nitro ? this.runSpeed : this.walkSpeed;
    const moveDir = new THREE.Vector3();

    // Calculate camera planar forward & right vectors
    const camForward = new THREE.Vector3();
    camera.getWorldDirection(camForward);
    camForward.y = 0;
    camForward.normalize();

    const camRight = new THREE.Vector3(camForward.z, 0, -camForward.x).negate();

    if (inputKeys.forward) moveDir.add(camForward);
    if (inputKeys.backward) moveDir.sub(camForward);
    if (inputKeys.left) moveDir.add(camRight);
    if (inputKeys.right) moveDir.sub(camRight);

    const isMoving = moveDir.lengthSq() > 0.01;

    if (isMoving) {
      moveDir.normalize();
      this.group.position.addScaledVector(moveDir, speed * delta);

      // Smooth rotation toward movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z);
      this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, delta * 14);

      // Procedural walking/running animation
      this.animTime += delta * (speed * 2.2);
      const swing = Math.sin(this.animTime) * (inputKeys.nitro ? 0.95 : 0.65);
      this.leftLeg.rotation.x = swing;
      this.rightLeg.rotation.x = -swing;
      this.leftArm.rotation.x = -swing * 0.8;
      this.rightArm.rotation.x = swing * 0.8;
      this.pelvis.position.y = 0.85 + Math.abs(Math.cos(this.animTime * 2)) * 0.05;
    } else {
      // Idle pose
      this.leftLeg.rotation.x = THREE.MathUtils.lerp(this.leftLeg.rotation.x, 0, delta * 10);
      this.rightLeg.rotation.x = THREE.MathUtils.lerp(this.rightLeg.rotation.x, 0, delta * 10);
      this.leftArm.rotation.x = THREE.MathUtils.lerp(this.leftArm.rotation.x, 0, delta * 10);
      this.rightArm.rotation.x = THREE.MathUtils.lerp(this.rightArm.rotation.x, 0, delta * 10);
      this.pelvis.position.y = 0.85;
    }

    // Jump Physics
    if (inputKeys.jump && this.isGrounded) {
      this.verticalVelocity = this.jumpForce;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.verticalVelocity -= 22.0 * delta; // Gravity
      this.group.position.y += this.verticalVelocity * delta;
      if (this.group.position.y <= 0.2) {
        this.group.position.y = 0.2;
        this.verticalVelocity = 0;
        this.isGrounded = true;
      }
    }

    // Proximity to vehicle prompt
    if (vehicle && this.interactPrompt) {
      const carCenter = new THREE.Vector3(vehicle.posX, 0.2, vehicle.posZ);
      const dist = this.group.position.distanceTo(carCenter);
      if (dist < 6.0) {
        this.interactPrompt.classList.add('visible');
        this.interactPrompt.textContent = '[F] ENTER VEHICLE';
      } else {
        this.interactPrompt.classList.remove('visible');
      }
    }
  }
}
