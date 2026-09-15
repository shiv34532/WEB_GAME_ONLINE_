import * as THREE from 'three';

export class CityBuilder {
  constructor(scene, physicsWorld) {
    this.scene = scene;
    this.physics = physicsWorld;

    this.sidewalkWaypoints = [];
    this.roadSegments = [];
    this.collisionBoxes = [];

    this.textures = this.generateTextures();
    this.materials = this.createMaterials();

    this.buildWorld();
  }

  generateTextures() {
    // 1. Asphalt Road Texture
    const roadCanvas = document.createElement('canvas');
    roadCanvas.width = 512;
    roadCanvas.height = 512;
    const rCtx = roadCanvas.getContext('2d');
    rCtx.fillStyle = '#20242b';
    rCtx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 2000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(26 + Math.random() * 20);
      rCtx.fillStyle = `rgb(${shade},${shade},${shade})`;
      rCtx.fillRect(x, y, 2, 2);
    }

    rCtx.fillStyle = '#ffaa00';
    rCtx.fillRect(251, 0, 4, 512);
    rCtx.fillRect(259, 0, 4, 512);

    rCtx.fillStyle = '#dce3ee';
    for (let y = 12; y < 512; y += 48) {
      rCtx.fillRect(128, y, 6, 24);
      rCtx.fillRect(380, y, 6, 24);
    }
    rCtx.fillRect(14, 0, 6, 512);
    rCtx.fillRect(492, 0, 6, 512);

    const roadTex = new THREE.CanvasTexture(roadCanvas);
    roadTex.wrapS = THREE.RepeatWrapping;
    roadTex.wrapT = THREE.RepeatWrapping;

    // 2. Runway Texture
    const runCanvas = document.createElement('canvas');
    runCanvas.width = 512;
    runCanvas.height = 512;
    const runCtx = runCanvas.getContext('2d');
    runCtx.fillStyle = '#1c1f24';
    runCtx.fillRect(0, 0, 512, 512);

    // Runway centerline dashes
    runCtx.fillStyle = '#ffffff';
    for (let y = 10; y < 512; y += 64) {
      runCtx.fillRect(246, y, 20, 36);
    }
    // Outer white boundaries
    runCtx.fillRect(20, 0, 8, 512);
    runCtx.fillRect(484, 0, 8, 512);

    const runwayTex = new THREE.CanvasTexture(runCanvas);
    runwayTex.wrapS = THREE.RepeatWrapping;
    runwayTex.wrapT = THREE.RepeatWrapping;

    // 3. Skyscraper Windows Texture
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 256;
    bCanvas.height = 256;
    const bCtx = bCanvas.getContext('2d');
    bCtx.fillStyle = '#141822';
    bCtx.fillRect(0, 0, 256, 256);

    for (let row = 6; row < 256; row += 22) {
      for (let col = 6; col < 256; col += 18) {
        const isLit = Math.random() > 0.4;
        bCtx.fillStyle = isLit ? 'rgba(255, 235, 175, 0.95)' : 'rgba(24, 32, 46, 0.95)';
        bCtx.fillRect(col, row, 12, 14);
      }
    }
    const bTex = new THREE.CanvasTexture(bCanvas);
    bTex.wrapS = THREE.RepeatWrapping;
    bTex.wrapT = THREE.RepeatWrapping;

    return { roadTex, runwayTex, bTex };
  }

  createMaterials() {
    return {
      road: new THREE.MeshStandardMaterial({
        map: this.textures.roadTex,
        roughness: 0.85,
        metalness: 0.1,
        side: THREE.DoubleSide
      }),
      runway: new THREE.MeshStandardMaterial({
        map: this.textures.runwayTex,
        roughness: 0.9,
        metalness: 0.1,
        side: THREE.DoubleSide
      }),
      sidewalk: new THREE.MeshStandardMaterial({
        color: 0x5a626d,
        roughness: 0.9
      }),
      buildingWall: new THREE.MeshStandardMaterial({
        map: this.textures.bTex,
        roughness: 0.35,
        metalness: 0.35
      }),
      glassFacade: new THREE.MeshStandardMaterial({
        color: 0x162438,
        roughness: 0.08,
        metalness: 0.9
      }),
      mallWall: new THREE.MeshStandardMaterial({
        color: 0xe0e6ed,
        roughness: 0.4,
        metalness: 0.2
      }),
      airplanePaint: new THREE.MeshStandardMaterial({
        color: 0xf7f9fc,
        roughness: 0.3,
        metalness: 0.6
      }),
      airplaneJet: new THREE.MeshStandardMaterial({
        color: 0x2b303a,
        roughness: 0.4,
        metalness: 0.8
      }),
      neonSign: new THREE.MeshBasicMaterial({
        color: 0x00f0ff
      }),
      mallSign: new THREE.MeshBasicMaterial({
        color: 0xff0055
      }),
      lampGlow: new THREE.MeshBasicMaterial({
        color: 0xfff3cc
      }),
      metalPole: new THREE.MeshStandardMaterial({
        color: 0x22262d,
        metalness: 0.8,
        roughness: 0.3
      }),
      foliage: new THREE.MeshStandardMaterial({
        color: 0x275e30,
        roughness: 0.85
      }),
      treeBark: new THREE.MeshStandardMaterial({
        color: 0x3b281d,
        roughness: 0.9
      })
    };
  }

  buildWorld() {
    // Huge terrain base spanning all 3 districts
    const worldSize = 1200;
    const groundGeo = new THREE.PlaneGeometry(worldSize, worldSize);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x12151b,
      roughness: 0.98,
      side: THREE.DoubleSide
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -0.02;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // 1. District: Downtown (Centered around X: 0, Z: 0)
    this.buildDowntownDistrict();

    // 2. District: International Airport (North: Z: -260 to -520)
    this.buildAirportDistrict();

    // 3. District: Grand Shopping Mall (South: Z: +240 to +480)
    this.buildMallDistrict();

    // 4. Connecting Highway System
    this.buildHighwaySystem();

    // 5. World Boundaries
    this.buildCityBorders(worldSize / 2 - 20);
  }

  // =========================================================================
  // DISTRICT 1: DOWNTOWN METROPOLIS
  // =========================================================================
  buildDowntownDistrict() {
    const blockSize = 55;
    const roadWidth = 18;
    const step = blockSize + roadWidth; // 73m

    for (let ix = -2; ix <= 2; ix++) {
      for (let iz = -2; iz <= 2; iz++) {
        // Skip central intersection at (0, 0) for open driving
        const bx = (ix + 0.5) * step;
        const bz = (iz + 0.5) * step;

        this.buildSkyscraperBlock(bx, bz, blockSize);
      }
    }

    // Downtown Roads
    for (let ix = -2; ix <= 2; ix++) {
      const rx = ix * step;
      this.createRoad(rx, 0, roadWidth, 380, 'vertical');
    }
    for (let iz = -2; iz <= 2; iz++) {
      const rz = iz * step;
      this.createRoad(0, rz, 380, roadWidth, 'horizontal');
    }
  }

  buildSkyscraperBlock(bx, bz, bSize) {
    // Sidewalk
    const swGeo = new THREE.BoxGeometry(bSize, 0.22, bSize);
    const swMesh = new THREE.Mesh(swGeo, this.materials.sidewalk);
    swMesh.position.set(bx, 0.11, bz);
    swMesh.receiveShadow = true;
    this.scene.add(swMesh);

    // Sidewalk Waypoints for NPCs
    const inset = bSize / 2 - 3;
    this.sidewalkWaypoints.push(
      new THREE.Vector3(bx - inset, 0.25, bz - inset),
      new THREE.Vector3(bx + inset, 0.25, bz - inset),
      new THREE.Vector3(bx + inset, 0.25, bz + inset),
      new THREE.Vector3(bx - inset, 0.25, bz + inset)
    );

    // Skyscrapers
    const h = 50 + Math.random() * 80;
    const foot = bSize - 10;
    const useGlass = Math.random() > 0.5;
    const mat = useGlass ? this.materials.glassFacade : this.materials.buildingWall;

    const bMesh = new THREE.Mesh(new THREE.BoxGeometry(foot, h, foot), mat);
    bMesh.position.set(bx, h / 2 + 0.22, bz);
    bMesh.castShadow = true;
    bMesh.receiveShadow = true;
    this.scene.add(bMesh);

    this.physics.addStaticBox({ x: bx, y: h / 2 + 0.22, z: bz }, { x: foot / 2, y: h / 2, z: foot / 2 });
    this.collisionBoxes.push({
      minX: bx - foot / 2,
      maxX: bx + foot / 2,
      minZ: bz - foot / 2,
      maxZ: bz + foot / 2
    });

    // Street Lamps
    this.createStreetLamp(bx + foot / 2 + 2, bz);
    this.createStreetLamp(bx - foot / 2 - 2, bz);
  }

  // =========================================================================
  // DISTRICT 2: INTERNATIONAL AIRPORT
  // =========================================================================
  buildAirportDistrict() {
    const airportZ = -360;

    // 1. Long Aircraft Runway (35m wide, 400m long)
    const runGeo = new THREE.PlaneGeometry(38, 380);
    const runMesh = new THREE.Mesh(runGeo, this.materials.runway);
    runMesh.rotation.x = -Math.PI / 2;
    runMesh.position.set(-60, 0.015, airportZ);
    runMesh.receiveShadow = true;
    this.scene.add(runMesh);

    // Runway Edge Lights (Green & Amber)
    for (let z = airportZ - 180; z <= airportZ + 180; z += 35) {
      this.createRunwayLight(-79, z, 0x00ff88);
      this.createRunwayLight(-41, z, 0x00ff88);
    }

    // 2. Airport Main Terminal Building (Glass, 140m wide)
    const termGeo = new THREE.BoxGeometry(130, 24, 45);
    const termMesh = new THREE.Mesh(termGeo, this.materials.glassFacade);
    termMesh.position.set(70, 12, airportZ);
    termMesh.castShadow = true;
    this.scene.add(termMesh);
    this.physics.addStaticBox({ x: 70, y: 12, z: airportZ }, { x: 65, y: 12, z: 22.5 });
    this.collisionBoxes.push({
      minX: 70 - 65,
      maxX: 70 + 65,
      minZ: airportZ - 22.5,
      maxZ: airportZ + 22.5
    });

    // Terminal Sign
    const signGeo = new THREE.BoxGeometry(60, 4, 1);
    const signMesh = new THREE.Mesh(signGeo, this.materials.neonSign);
    signMesh.position.set(70, 26, airportZ + 23);
    this.scene.add(signMesh);

    // Airport Control Tower
    const towerGeo = new THREE.CylinderGeometry(4, 5, 55, 12);
    const towerMesh = new THREE.Mesh(towerGeo, this.materials.mallWall);
    towerMesh.position.set(150, 27.5, airportZ - 50);
    towerMesh.castShadow = true;
    this.scene.add(towerMesh);

    const cabGeo = new THREE.CylinderGeometry(8, 6, 8, 12);
    const cabMesh = new THREE.Mesh(cabGeo, this.materials.glassFacade);
    cabMesh.position.set(150, 56, airportZ - 50);
    this.scene.add(cabMesh);

    // 3. Parked Commercial Jet Airplanes (2 parked on apron)
    this.createJetAirplane(new THREE.Vector3(20, 0, airportZ - 70), Math.PI / 4);
    this.createJetAirplane(new THREE.Vector3(20, 0, airportZ + 70), -Math.PI / 4);

    // Airport Sidewalks & Waypoints for Travelers & Security
    this.sidewalkWaypoints.push(
      new THREE.Vector3(70, 0.25, airportZ + 30),
      new THREE.Vector3(40, 0.25, airportZ + 30),
      new THREE.Vector3(100, 0.25, airportZ + 30),
      new THREE.Vector3(70, 0.25, airportZ - 30)
    );
  }

  createJetAirplane(pos, rotY) {
    const plane = new THREE.Group();
    plane.position.copy(pos);
    plane.rotation.y = rotY;

    // Fuselage (Body)
    const fuseGeo = new THREE.CylinderGeometry(2.4, 2.4, 38, 16);
    fuseGeo.rotateX(Math.PI / 2);
    const fuseMesh = new THREE.Mesh(fuseGeo, this.materials.airplanePaint);
    fuseMesh.position.y = 3.6;
    fuseMesh.castShadow = true;
    plane.add(fuseMesh);

    // Nose Cone
    const noseGeo = new THREE.ConeGeometry(2.4, 6, 16);
    noseGeo.rotateX(Math.PI / 2);
    const noseMesh = new THREE.Mesh(noseGeo, this.materials.airplanePaint);
    noseMesh.position.set(0, 3.6, 22);
    plane.add(noseMesh);

    // Main Wings (Span ~34m)
    const wingGeo = new THREE.BoxGeometry(34, 0.4, 6.5);
    const wingMesh = new THREE.Mesh(wingGeo, this.materials.airplanePaint);
    wingMesh.position.set(0, 3.4, 2);
    wingMesh.castShadow = true;
    plane.add(wingMesh);

    // Twin Jet Turbofans
    [-8, 8].forEach(x => {
      const jetGeo = new THREE.CylinderGeometry(1.2, 1.2, 5, 12);
      jetGeo.rotateX(Math.PI / 2);
      const jetMesh = new THREE.Mesh(jetGeo, this.materials.airplaneJet);
      jetMesh.position.set(x, 2.2, 2);
      plane.add(jetMesh);
    });

    // Vertical Tailfin
    const tailGeo = new THREE.BoxGeometry(0.3, 7, 5);
    const tailMesh = new THREE.Mesh(tailGeo, this.materials.airplanePaint);
    tailMesh.position.set(0, 7.2, -16);
    plane.add(tailMesh);

    this.scene.add(plane);

    // Collider for Airplane Body
    this.physics.addStaticBox(
      { x: pos.x, y: 3.6, z: pos.z },
      { x: 12, y: 3.6, z: 18 }
    );
  }

  createRunwayLight(x, z, colorHex) {
    const lightGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.6, 6);
    const lightMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const lightMesh = new THREE.Mesh(lightGeo, lightMat);
    lightMesh.position.set(x, 0.3, z);
    this.scene.add(lightMesh);
  }

  // =========================================================================
  // DISTRICT 3: GRAND SHOPPING MALL & PARKING
  // =========================================================================
  buildMallDistrict() {
    const mallZ = 350;

    // 1. Grand Shopping Mall Complex
    const mallGeo = new THREE.BoxGeometry(160, 22, 110);
    const mallMesh = new THREE.Mesh(mallGeo, this.materials.mallWall);
    mallMesh.position.set(0, 11, mallZ);
    mallMesh.castShadow = true;
    this.scene.add(mallMesh);
    this.physics.addStaticBox({ x: 0, y: 11, z: mallZ }, { x: 80, y: 11, z: 55 });
    this.collisionBoxes.push({
      minX: -80,
      maxX: 80,
      minZ: mallZ - 55,
      maxZ: mallZ + 55
    });

    // Glass Atrium Front Entrance
    const atriumGeo = new THREE.BoxGeometry(50, 18, 12);
    const atriumMesh = new THREE.Mesh(atriumGeo, this.materials.glassFacade);
    atriumMesh.position.set(0, 9, mallZ - 56);
    this.scene.add(atriumMesh);

    // Glowing Mall Signs
    const signGeo = new THREE.BoxGeometry(70, 5, 1);
    const signMesh = new THREE.Mesh(signGeo, this.materials.mallSign);
    signMesh.position.set(0, 24, mallZ - 56);
    this.scene.add(signMesh);

    // 2. Large Outdoor Mall Parking Lot (Asphalt)
    const parkGeo = new THREE.PlaneGeometry(160, 90);
    const parkMesh = new THREE.Mesh(parkGeo, this.materials.road);
    parkMesh.rotation.x = -Math.PI / 2;
    parkMesh.position.set(0, 0.015, mallZ - 110);
    parkMesh.receiveShadow = true;
    this.scene.add(parkMesh);

    // Decorative parked car blocks in parking lot
    [-50, -20, 20, 50].forEach(x => {
      const carBlock = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 1.4, 2.1),
        new THREE.MeshStandardMaterial({ color: Math.random() > 0.5 ? 0x223355 : 0x882222, roughness: 0.3 })
      );
      carBlock.position.set(x, 0.7, mallZ - 110);
      carBlock.castShadow = true;
      this.scene.add(carBlock);
      this.physics.addStaticBox({ x, y: 0.7, z: mallZ - 110 }, { x: 2.1, y: 0.7, z: 1.05 });
    });

    // Mall Sidewalks and Shopper Waypoints
    this.sidewalkWaypoints.push(
      new THREE.Vector3(-40, 0.25, mallZ - 65),
      new THREE.Vector3(0, 0.25, mallZ - 65),
      new THREE.Vector3(40, 0.25, mallZ - 65),
      new THREE.Vector3(0, 0.25, mallZ - 130)
    );
  }

  // =========================================================================
  // CONNECTING HIGHWAY SYSTEM
  // =========================================================================
  buildHighwaySystem() {
    // Grand Central Highway (Connecting Airport [Z: -360] -> Downtown [Z: 0] -> Mall [Z: +350])
    this.createRoad(0, 0, 24, 900, 'vertical');

    // Transverse Highways
    this.createRoad(0, -220, 500, 20, 'horizontal'); // Highway to Airport
    this.createRoad(0, 220, 500, 20, 'horizontal');  // Highway to Mall
  }

  createRoad(x, z, w, len, dir) {
    const rGeo = new THREE.PlaneGeometry(dir === 'vertical' ? w : len, dir === 'vertical' ? len : w);
    const rMesh = new THREE.Mesh(rGeo, this.materials.road);
    rMesh.rotation.x = -Math.PI / 2;
    rMesh.position.set(x, 0.01, z);
    rMesh.receiveShadow = true;
    this.scene.add(rMesh);

    this.roadSegments.push({ x, z, w: dir === 'vertical' ? w : len, h: dir === 'vertical' ? len : w });
  }

  createStreetLamp(x, z) {
    const group = new THREE.Group();
    group.position.set(x, 0.22, z);

    const poleGeo = new THREE.CylinderGeometry(0.1, 0.15, 5.5, 6);
    const poleMesh = new THREE.Mesh(poleGeo, this.materials.metalPole);
    poleMesh.position.y = 2.75;
    group.add(poleMesh);

    const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 1.4), this.materials.metalPole);
    armMesh.position.set(0, 5.4, 0.6);
    group.add(armMesh);

    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.24, 8, 8), this.materials.lampGlow);
    bulbMesh.position.set(0, 5.2, 1.2);
    group.add(bulbMesh);

    this.scene.add(group);
  }

  buildCityBorders(bound) {
    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xaa2222, roughness: 0.6 });
    const borders = [
      { x: 0, z: bound, w: bound * 2, h: 3, d: 1 },
      { x: 0, z: -bound, w: bound * 2, h: 3, d: 1 },
      { x: bound, z: 0, w: 1, h: 3, d: bound * 2 },
      { x: -bound, z: 0, w: 1, h: 3, d: bound * 2 }
    ];

    borders.forEach(b => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), barrierMat);
      mesh.position.set(b.x, b.h / 2, b.z);
      this.scene.add(mesh);
      this.physics.addStaticBox({ x: b.x, y: b.h / 2, z: b.z }, { x: b.w / 2, y: b.h / 2, z: b.d / 2 });
    });
  }

  getDistrictName(pos) {
    if (!pos) return 'OPEN WORLD';
    if (pos.z < -200) return '✈️ INTERNATIONAL AIRPORT';
    if (pos.z > 200) return '🛍️ GRAND SHOPPING MALL';
    return '🏙️ DOWNTOWN METROPOLIS';
  }

  setStreetLights(isNight) {
    this.materials.lampGlow.color.setHex(isNight ? 0xfff3cc : 0x777777);
  }

  checkCollision(x, z, radius = 1.8) {
    // World boundary check
    if (Math.abs(x) > 570 || Math.abs(z) > 570) return true;

    // Check all building obstacles
    for (let i = 0; i < this.collisionBoxes.length; i++) {
      const box = this.collisionBoxes[i];
      if (
        x + radius > box.minX &&
        x - radius < box.maxX &&
        z + radius > box.minZ &&
        z - radius < box.maxZ
      ) {
        return true;
      }
    }
    return false;
  }
}
