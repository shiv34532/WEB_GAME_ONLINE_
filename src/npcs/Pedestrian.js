import * as THREE from 'three';

export class Pedestrian {
  constructor(scene, startPos, waypoints = [], role = 'civilian') {
    this.scene = scene;
    this.waypoints = waypoints;
    this.role = role; // 'civilian' | 'police' | 'business'
    this.targetWaypoint = null;

    this.walkSpeed = role === 'police' ? 2.2 : (1.5 + Math.random() * 0.7);
    this.animTime = Math.random() * 10;
    this.isPanicked = false;
    this.panicTimer = 0;

    this.buildMesh(startPos);
    this.pickNextWaypoint();
  }

  buildMesh(pos) {
    this.group = new THREE.Group();
    this.group.position.copy(pos);

    // Setup role-based materials
    let shirtMat, pantMat, skinMat, accessoryMat;
    const skinColors = [0xf5d6b8, 0xe0ac69, 0x8d5524, 0xc68642];
    skinMat = new THREE.MeshStandardMaterial({
      color: skinColors[Math.floor(Math.random() * skinColors.length)],
      roughness: 0.7
    });

    if (this.role === 'police') {
      // Police Uniform
      shirtMat = new THREE.MeshStandardMaterial({ color: 0x1a2e4c, roughness: 0.6 }); // Navy Blue
      pantMat = new THREE.MeshStandardMaterial({ color: 0x141f30, roughness: 0.7 });
      accessoryMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.9, roughness: 0.2 }); // Gold Badge
    } else if (this.role === 'business') {
      // Formal Suit
      shirtMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.5 }); // Charcoal Suit
      pantMat = new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.5 });
      accessoryMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11, roughness: 0.4 }); // Leather Briefcase
    } else {
      // Civilian
      const shirtColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf1c40f, 0x9b59b6, 0x1abc9c, 0xe67e22];
      const pantColors = [0x2c3e50, 0x34495e, 0x7f8c8d, 0x1e272e];
      shirtMat = new THREE.MeshStandardMaterial({
        color: shirtColors[Math.floor(Math.random() * shirtColors.length)],
        roughness: 0.8
      });
      pantMat = new THREE.MeshStandardMaterial({
        color: pantColors[Math.floor(Math.random() * pantColors.length)],
        roughness: 0.9
      });
    }

    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // Hips
    this.pelvis = new THREE.Group();
    this.pelvis.position.y = 0.85;
    this.group.add(this.pelvis);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.48, 0.22);
    const torsoMesh = new THREE.Mesh(torsoGeo, shirtMat);
    torsoMesh.position.y = 0.26;
    this.pelvis.add(torsoMesh);

    // Police Badge or Tie
    if (this.role === 'police') {
      const badgeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.03);
      const badgeMesh = new THREE.Mesh(badgeGeo, accessoryMat);
      badgeMesh.position.set(-0.1, 0.35, 0.12);
      this.pelvis.add(badgeMesh);
    } else if (this.role === 'business') {
      const tieGeo = new THREE.BoxGeometry(0.06, 0.3, 0.02);
      const tieMat = new THREE.MeshStandardMaterial({ color: 0x990000 });
      const tieMesh = new THREE.Mesh(tieGeo, tieMat);
      tieMesh.position.set(0, 0.25, 0.12);
      this.pelvis.add(tieMesh);
    }

    // Head
    const headGeo = new THREE.BoxGeometry(0.22, 0.24, 0.22);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, 0.64, 0);
    this.pelvis.add(headMesh);

    // Police Cap or Hair
    if (this.role === 'police') {
      const capGeo = new THREE.BoxGeometry(0.26, 0.12, 0.28);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x141f30, roughness: 0.5 });
      const capMesh = new THREE.Mesh(capGeo, capMat);
      capMesh.position.set(0, 0.77, 0.03);
      this.pelvis.add(capMesh);
    } else {
      const hairGeo = new THREE.BoxGeometry(0.24, 0.08, 0.24);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x1f1f1f, roughness: 0.9 });
      const hairMesh = new THREE.Mesh(hairGeo, hairMat);
      hairMesh.position.set(0, 0.75, 0);
      this.pelvis.add(hairMesh);
    }

    // Left & Right Legs
    const legGeo = new THREE.BoxGeometry(0.14, 0.45, 0.14);
    const footGeo = new THREE.BoxGeometry(0.14, 0.1, 0.22);

    this.leftLegPivot = new THREE.Group();
    this.leftLegPivot.position.set(-0.1, 0, 0);
    const legL = new THREE.Mesh(legGeo, pantMat);
    legL.position.y = -0.22;
    const footL = new THREE.Mesh(footGeo, shoeMat);
    footL.position.set(0, -0.45, 0.04);
    this.leftLegPivot.add(legL);
    this.leftLegPivot.add(footL);
    this.pelvis.add(this.leftLegPivot);

    this.rightLegPivot = new THREE.Group();
    this.rightLegPivot.position.set(0.1, 0, 0);
    const legR = new THREE.Mesh(legGeo, pantMat);
    legR.position.y = -0.22;
    const footR = new THREE.Mesh(footGeo, shoeMat);
    footR.position.set(0, -0.45, 0.04);
    this.rightLegPivot.add(legR);
    this.rightLegPivot.add(footR);
    this.pelvis.add(this.rightLegPivot);

    // Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.1, 0.42, 0.1);
    this.leftArmPivot = new THREE.Group();
    this.leftArmPivot.position.set(-0.25, 0.46, 0);
    const armL = new THREE.Mesh(armGeo, shirtMat);
    armL.position.y = -0.2;
    this.leftArmPivot.add(armL);
    this.pelvis.add(this.leftArmPivot);

    this.rightArmPivot = new THREE.Group();
    this.rightArmPivot.position.set(0.25, 0.46, 0);
    const armR = new THREE.Mesh(armGeo, shirtMat);
    armR.position.y = -0.2;
    this.rightArmPivot.add(armR);

    // Business Briefcase
    if (this.role === 'business') {
      const caseGeo = new THREE.BoxGeometry(0.1, 0.28, 0.35);
      const caseMesh = new THREE.Mesh(caseGeo, accessoryMat);
      caseMesh.position.set(0.08, -0.35, 0.05);
      this.rightArmPivot.add(caseMesh);
    }

    this.pelvis.add(this.rightArmPivot);

    this.scene.add(this.group);
  }

  pickNextWaypoint() {
    if (this.waypoints.length === 0) return;
    const current = this.group.position;
    const candidates = this.waypoints.filter(wp => wp.distanceTo(current) > 6 && wp.distanceTo(current) < 80);
    if (candidates.length > 0) {
      this.targetWaypoint = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      this.targetWaypoint = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
    }
  }

  panic() {
    this.isPanicked = true;
    this.panicTimer = 3.5;
  }

  update(delta, playerPos, playerSpeed) {
    if (!this.group) return;

    // React to speeding vehicles or honks
    const distToPlayer = this.group.position.distanceTo(playerPos);
    if (distToPlayer < 7 && playerSpeed > 15) {
      this.panic();
    }

    if (this.isPanicked) {
      this.panicTimer -= delta;
      if (this.panicTimer <= 0) this.isPanicked = false;
    }

    const currentSpeed = this.isPanicked ? this.walkSpeed * 2.4 : this.walkSpeed;
    this.animTime += delta * (currentSpeed * 3.8);

    // Limb walking cycles
    const swingAngle = Math.sin(this.animTime) * 0.65;
    this.leftLegPivot.rotation.x = swingAngle;
    this.rightLegPivot.rotation.x = -swingAngle;
    this.leftArmPivot.rotation.x = -swingAngle * 0.8;
    this.rightArmPivot.rotation.x = swingAngle * 0.8;

    // Body bobbing
    this.pelvis.position.y = 0.85 + Math.abs(Math.cos(this.animTime * 2)) * 0.04;

    // Waypoint Navigation
    if (this.targetWaypoint) {
      const pos = this.group.position;
      const dir = new THREE.Vector3().subVectors(this.targetWaypoint, pos);
      dir.y = 0;
      const dist = dir.length();

      if (dist < 2.0) {
        this.pickNextWaypoint();
      } else {
        dir.normalize();

        // Evade player if dangerously close
        if (distToPlayer < 5) {
          const evadeDir = new THREE.Vector3().subVectors(pos, playerPos).normalize();
          evadeDir.y = 0;
          dir.addScaledVector(evadeDir, 2.0).normalize();
        }

        pos.addScaledVector(dir, currentSpeed * delta);

        const targetAngle = Math.atan2(dir.x, dir.z);
        this.group.rotation.y = THREE.MathUtils.lerp(this.group.rotation.y, targetAngle, delta * 8);
      }
    }
  }
}
