import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene, maxParticles = 120) {
    this.scene = scene;
    this.maxParticles = maxParticles;
    this.particles = [];

    // Create smoke particle geometry and material
    const geo = new THREE.PlaneGeometry(0.8, 0.8);
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(230, 235, 245, 0.8)');
    grad.addColorStop(0.5, 'rgba(180, 190, 205, 0.3)');
    grad.addColorStop(1, 'rgba(100, 110, 120, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      opacity: 0.6
    });

    for (let i = 0; i < maxParticles; i++) {
      const mesh = new THREE.Mesh(geo, mat.clone());
      mesh.visible = false;
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        life: 0,
        maxLife: 1.0,
        vel: new THREE.Vector3(),
        rotSpeed: 0
      });
    }

    this.nextIndex = 0;
  }

  emit(pos, velocity) {
    const p = this.particles[this.nextIndex];
    this.nextIndex = (this.nextIndex + 1) % this.maxParticles;

    p.mesh.position.copy(pos);
    p.mesh.position.x += (Math.random() - 0.5) * 0.3;
    p.mesh.position.y += Math.random() * 0.15;
    p.mesh.position.z += (Math.random() - 0.5) * 0.3;

    p.mesh.scale.setScalar(0.4 + Math.random() * 0.3);
    p.mesh.rotation.z = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 2;

    p.vel.set(
      (Math.random() - 0.5) * 0.5 + velocity.x * 0.1,
      0.6 + Math.random() * 0.4,
      (Math.random() - 0.5) * 0.5 + velocity.z * 0.1
    );

    p.life = 0;
    p.maxLife = 0.6 + Math.random() * 0.4;
    p.mesh.material.opacity = 0.55;
    p.mesh.visible = true;
  }

  update(delta, camera) {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.particles[i];
      if (!p.mesh.visible) continue;

      p.life += delta;
      if (p.life >= p.maxLife) {
        p.mesh.visible = false;
        continue;
      }

      const progress = p.life / p.maxLife;

      // Expand and float up
      p.mesh.position.addScaledVector(p.vel, delta);
      p.mesh.scale.multiplyScalar(1 + delta * 1.8);
      p.mesh.rotation.z += p.rotSpeed * delta;
      p.mesh.material.opacity = (1 - progress) * 0.55;

      // Face camera (billboarding)
      if (camera) {
        p.mesh.quaternion.copy(camera.quaternion);
      }
    }
  }
}
