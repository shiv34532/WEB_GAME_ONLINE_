import * as THREE from 'three';

export class SkyAtmosphere {
  constructor(scene) {
    this.scene = scene;

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(this.ambientLight);

    // Hemisphere light (sky dome vs ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x334455, 0.55);
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    // Directional Sun / Moon Light with optimized shadows
    this.sunLight = new THREE.DirectionalLight(0xfff3e0, 1.6);
    this.sunLight.position.set(60, 90, 50);
    this.sunLight.castShadow = true;

    // High performance shadow configuration (1024x1024 is fast and crisp)
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 5;
    this.sunLight.shadow.camera.far = 250;
    const shadowD = 65;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.sunLight.shadow.bias = -0.0006;
    this.sunLight.shadow.normalBias = 0.02;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Sky Dome
    this.createSkyDome();

    // Default to Golden Hour
    this.setTime('sunset');
  }

  createSkyDome() {
    const vertexShader = `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;

      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `;

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x193b68) },
      bottomColor: { value: new THREE.Color(0xff8a48) },
      offset: { value: 33 },
      exponent: { value: 0.6 }
    };

    const skyGeo = new THREE.SphereGeometry(500, 24, 12);
    const skyMat = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: this.skyUniforms,
      side: THREE.BackSide
    });

    this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyMesh);
  }

  setTime(timeMode) {
    this.currentTimeMode = timeMode;

    switch (timeMode) {
      case 'sunset': // Golden Hour
        this.scene.background = new THREE.Color(0x151b2e);
        this.scene.fog.color.setHex(0x282338);
        this.scene.fog.density = 0.0028;

        this.skyUniforms.topColor.value.setHex(0x1a2e56);
        this.skyUniforms.bottomColor.value.setHex(0xff7744);

        this.sunLight.position.set(90, 45, 70);
        this.sunLight.color.setHex(0xffaa55);
        this.sunLight.intensity = 1.9;

        this.hemiLight.color.setHex(0xffb088);
        this.hemiLight.groundColor.setHex(0x283040);
        this.hemiLight.intensity = 0.6;

        this.ambientLight.color.setHex(0x332822);
        this.ambientLight.intensity = 0.5;
        break;

      case 'noon': // Bright Day
        this.scene.background = new THREE.Color(0x5ca9e6);
        this.scene.fog.color.setHex(0x84bfe8);
        this.scene.fog.density = 0.0016;

        this.skyUniforms.topColor.value.setHex(0x1f74d0);
        this.skyUniforms.bottomColor.value.setHex(0xdaf0ff);

        this.sunLight.position.set(40, 120, 30);
        this.sunLight.color.setHex(0xffffff);
        this.sunLight.intensity = 2.2;

        this.hemiLight.color.setHex(0xffffff);
        this.hemiLight.groundColor.setHex(0x444444);
        this.hemiLight.intensity = 0.8;

        this.ambientLight.color.setHex(0x555555);
        this.ambientLight.intensity = 0.6;
        break;

      case 'night': // Cyberpunk Night
        this.scene.background = new THREE.Color(0x05070f);
        this.scene.fog.color.setHex(0x080b18);
        this.scene.fog.density = 0.0035;

        this.skyUniforms.topColor.value.setHex(0x020308);
        this.skyUniforms.bottomColor.value.setHex(0x0c1428);

        this.sunLight.position.set(50, 80, -30);
        this.sunLight.color.setHex(0x5577cc);
        this.sunLight.intensity = 0.6;

        this.hemiLight.color.setHex(0x1f2e4c);
        this.hemiLight.groundColor.setHex(0x080d1a);
        this.hemiLight.intensity = 0.45;

        this.ambientLight.color.setHex(0x1a2238);
        this.ambientLight.intensity = 0.45;
        break;
    }
  }

  update(targetPosition) {
    if (targetPosition) {
      this.sunLight.position.x = targetPosition.x + (this.currentTimeMode === 'sunset' ? 90 : 40);
      this.sunLight.position.z = targetPosition.z + (this.currentTimeMode === 'sunset' ? 70 : 30);
      this.sunLight.target.position.copy(targetPosition);
      this.skyMesh.position.copy(targetPosition);
    }
  }
}
