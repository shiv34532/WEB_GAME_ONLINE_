import * as THREE from 'three';

export class CarModels {
  static createMaterials() {
    // High-fidelity PBR Materials
    return {
      supercarPaint: new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        metalness: 0.9,
        roughness: 0.15,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1
      }),
      musclePaint: new THREE.MeshPhysicalMaterial({
        color: 0xd63031,
        metalness: 0.8,
        roughness: 0.25,
        clearcoat: 0.8
      }),
      sedanPaint: new THREE.MeshPhysicalMaterial({
        color: 0x22324d,
        metalness: 0.9,
        roughness: 0.2,
        clearcoat: 1.0
      }),
      suvPaint: new THREE.MeshStandardMaterial({
        color: 0x272b34,
        metalness: 0.5,
        roughness: 0.4
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x111622,
        metalness: 0.9,
        roughness: 0.05,
        transmission: 0.7,
        transparent: true,
        opacity: 0.85
      }),
      rubberTire: new THREE.MeshStandardMaterial({
        color: 0x18181a,
        roughness: 0.9,
        metalness: 0.1
      }),
      alloyRim: new THREE.MeshStandardMaterial({
        color: 0xd5dce5,
        metalness: 0.95,
        roughness: 0.2
      }),
      carbonFiber: new THREE.MeshStandardMaterial({
        color: 0x151618,
        roughness: 0.4,
        metalness: 0.5
      }),
      chrome: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.98,
        roughness: 0.05
      }),
      headlightOff: new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.2
      }),
      headlightOn: new THREE.MeshBasicMaterial({
        color: 0xffffff
      }),
      taillightOff: new THREE.MeshStandardMaterial({
        color: 0x660000,
        roughness: 0.3
      }),
      taillightOn: new THREE.MeshBasicMaterial({
        color: 0xff1122
      }),
      brakeLightBright: new THREE.MeshBasicMaterial({
        color: 0xff0000
      }),
      interior: new THREE.MeshStandardMaterial({
        color: 0x1a1a1e,
        roughness: 0.8
      })
    };
  }

  // Common Wheel Mesh Generator
  static createWheelMesh(radius = 0.36, width = 0.28, mats) {
    const group = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(radius, radius, width, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, mats.rubberTire);
    tireMesh.castShadow = true;
    group.add(tireMesh);

    // Rim Outer Ring
    const rimGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, width + 0.02, 16);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, mats.alloyRim);
    group.add(rimMesh);

    // Spokes
    for (let i = 0; i < 5; i++) {
      const spokeGeo = new THREE.BoxGeometry(width + 0.03, radius * 0.7, 0.05);
      const spokeMesh = new THREE.Mesh(spokeGeo, mats.alloyRim);
      spokeMesh.rotation.x = (i * Math.PI) / 2.5;
      group.add(spokeMesh);
    }

    return group;
  }

  // 1. Supercar (Exotic GT)
  static buildSupercar(mats) {
    const car = new THREE.Group();
    const headlights = [];
    const taillights = [];
    const spotLights = [];

    // Lower chassis & aerodynamic floor
    const floorGeo = new THREE.BoxGeometry(1.95, 0.25, 4.3);
    const floorMesh = new THREE.Mesh(floorGeo, mats.carbonFiber);
    floorMesh.position.set(0, 0.2, 0);
    floorMesh.castShadow = true;
    car.add(floorMesh);

    // Main sculpted body
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.45, 4.2);
    const bodyMesh = new THREE.Mesh(bodyGeo, mats.supercarPaint);
    bodyMesh.position.set(0, 0.45, 0);
    bodyMesh.castShadow = true;
    car.add(bodyMesh);

    // Aerodynamic tapered hood
    const hoodGeo = new THREE.BoxGeometry(1.7, 0.25, 1.4);
    const hoodMesh = new THREE.Mesh(hoodGeo, mats.supercarPaint);
    hoodMesh.position.set(0, 0.55, 1.3);
    hoodMesh.rotation.x = -0.12;
    hoodMesh.castShadow = true;
    car.add(hoodMesh);

    // Cockpit cabin & roof
    const cabinGeo = new THREE.BoxGeometry(1.4, 0.45, 1.9);
    const cabinMesh = new THREE.Mesh(cabinGeo, mats.supercarPaint);
    cabinMesh.position.set(0, 0.85, -0.2);
    cabinMesh.castShadow = true;
    car.add(cabinMesh);

    // Tinted windshield & windows
    const windGeo = new THREE.BoxGeometry(1.35, 0.42, 1.1);
    const windMesh = new THREE.Mesh(windGeo, mats.glass);
    windMesh.position.set(0, 0.84, 0.35);
    windMesh.rotation.x = -0.45;
    car.add(windMesh);

    const rearWinGeo = new THREE.BoxGeometry(1.35, 0.38, 1.0);
    const rearWinMesh = new THREE.Mesh(rearWinGeo, mats.glass);
    rearWinMesh.position.set(0, 0.82, -0.75);
    rearWinMesh.rotation.x = 0.45;
    car.add(rearWinMesh);

    // Rear wing / GT spoiler
    const wingStandGeo = new THREE.BoxGeometry(0.08, 0.35, 0.25);
    const standL = new THREE.Mesh(wingStandGeo, mats.carbonFiber);
    standL.position.set(-0.6, 0.85, -1.9);
    const standR = standL.clone();
    standR.position.x = 0.6;
    car.add(standL);
    car.add(standR);

    const wingBladeGeo = new THREE.BoxGeometry(1.85, 0.06, 0.38);
    const wingBlade = new THREE.Mesh(wingBladeGeo, mats.carbonFiber);
    wingBlade.position.set(0, 1.05, -1.9);
    wingBlade.castShadow = true;
    car.add(wingBlade);

    // Front Splitter
    const splitGeo = new THREE.BoxGeometry(1.92, 0.06, 0.4);
    const splitter = new THREE.Mesh(splitGeo, mats.carbonFiber);
    splitter.position.set(0, 0.12, 2.15);
    car.add(splitter);

    // LED Slit Headlights
    const hlGeo = new THREE.BoxGeometry(0.35, 0.08, 0.1);
    const hlLeft = new THREE.Mesh(hlGeo, mats.headlightOn);
    hlLeft.position.set(-0.65, 0.52, 2.08);
    const hlRight = hlLeft.clone();
    hlRight.position.x = 0.65;
    car.add(hlLeft);
    car.add(hlRight);
    headlights.push(hlLeft, hlRight);

    // Headlight dynamic Spotlights projecting forward
    [-0.65, 0.65].forEach(xOffset => {
      const spot = new THREE.SpotLight(0xffffff, 2.5, 45, Math.PI / 5, 0.3, 1.2);
      spot.position.set(xOffset, 0.6, 2.1);
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(xOffset, 0.2, 30);
      car.add(spot);
      car.add(spotTarget);
      spot.target = spotTarget;
      spotLights.push(spot);
    });

    // Sleek LED Rear Taillights
    const tlGeo = new THREE.BoxGeometry(0.45, 0.08, 0.08);
    const tlLeft = new THREE.Mesh(tlGeo, mats.taillightOn);
    tlLeft.position.set(-0.65, 0.55, -2.08);
    const tlRight = tlLeft.clone();
    tlRight.position.x = 0.65;
    car.add(tlLeft);
    car.add(tlRight);
    taillights.push(tlLeft, tlRight);

    return { mesh: car, headlights, taillights, spotLights, mats };
  }

  // 2. American Muscle Car
  static buildMuscle(mats) {
    const car = new THREE.Group();
    const headlights = [];
    const taillights = [];
    const spotLights = [];

    // Muscular square body
    const bodyGeo = new THREE.BoxGeometry(2.0, 0.55, 4.4);
    const bodyMesh = new THREE.Mesh(bodyGeo, mats.musclePaint);
    bodyMesh.position.set(0, 0.55, 0);
    bodyMesh.castShadow = true;
    car.add(bodyMesh);

    // Bulging Hood Scoop
    const scoopGeo = new THREE.BoxGeometry(0.7, 0.16, 1.4);
    const scoopMesh = new THREE.Mesh(scoopGeo, mats.carbonFiber);
    scoopMesh.position.set(0, 0.85, 1.1);
    scoopMesh.castShadow = true;
    car.add(scoopMesh);

    // Fastback roof
    const roofGeo = new THREE.BoxGeometry(1.5, 0.5, 2.2);
    const roofMesh = new THREE.Mesh(roofGeo, mats.musclePaint);
    roofMesh.position.set(0, 1.0, -0.3);
    roofMesh.castShadow = true;
    car.add(roofMesh);

    // Windshield & Rear glass
    const windGeo = new THREE.BoxGeometry(1.42, 0.45, 0.8);
    const windMesh = new THREE.Mesh(windGeo, mats.glass);
    windMesh.position.set(0, 0.98, 0.6);
    windMesh.rotation.x = -0.4;
    car.add(windMesh);

    // Classic Chrome Front Bumper & Grille
    const grilleGeo = new THREE.BoxGeometry(1.85, 0.3, 0.15);
    const grilleMesh = new THREE.Mesh(grilleGeo, mats.chrome);
    grilleMesh.position.set(0, 0.5, 2.2);
    car.add(grilleMesh);

    // Dual Round Headlights
    [-0.65, -0.4, 0.4, 0.65].forEach(x => {
      const hlGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
      hlGeo.rotateX(Math.PI / 2);
      const hl = new THREE.Mesh(hlGeo, mats.headlightOn);
      hl.position.set(x, 0.52, 2.24);
      car.add(hl);
      headlights.push(hl);
    });

    // Spotlights
    [-0.55, 0.55].forEach(xOffset => {
      const spot = new THREE.SpotLight(0xffeedd, 2.5, 45, Math.PI / 5, 0.3, 1.2);
      spot.position.set(xOffset, 0.6, 2.2);
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(xOffset, 0.2, 30);
      car.add(spot);
      car.add(spotTarget);
      spot.target = spotTarget;
      spotLights.push(spot);
    });

    // Triple vertical taillight clusters
    [-0.7, -0.6, 0.6, 0.7].forEach(x => {
      const tlGeo = new THREE.BoxGeometry(0.08, 0.22, 0.05);
      const tl = new THREE.Mesh(tlGeo, mats.taillightOn);
      tl.position.set(x, 0.56, -2.2);
      car.add(tl);
      taillights.push(tl);
    });

    return { mesh: car, headlights, taillights, spotLights, mats };
  }

  // 3. Luxury Sports Sedan
  static buildSedan(mats) {
    const car = new THREE.Group();
    const headlights = [];
    const taillights = [];
    const spotLights = [];

    // Executive elongated body
    const bodyGeo = new THREE.BoxGeometry(1.9, 0.52, 4.6);
    const bodyMesh = new THREE.Mesh(bodyGeo, mats.sedanPaint);
    bodyMesh.position.set(0, 0.52, 0);
    bodyMesh.castShadow = true;
    car.add(bodyMesh);

    // Spacious 4-door cabin
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.55, 2.6);
    const cabinMesh = new THREE.Mesh(cabinGeo, mats.sedanPaint);
    cabinMesh.position.set(0, 1.0, -0.15);
    cabinMesh.castShadow = true;
    car.add(cabinMesh);

    // Panoramic glass roof
    const glassRoofGeo = new THREE.BoxGeometry(1.3, 0.05, 1.8);
    const glassRoofMesh = new THREE.Mesh(glassRoofGeo, mats.glass);
    glassRoofMesh.position.set(0, 1.3, -0.15);
    car.add(glassRoofMesh);

    // Windshield
    const windGeo = new THREE.BoxGeometry(1.45, 0.5, 0.9);
    const windMesh = new THREE.Mesh(windGeo, mats.glass);
    windMesh.position.set(0, 0.98, 0.95);
    windMesh.rotation.x = -0.45;
    car.add(windMesh);

    // Matrix LED Headlights
    const hlGeo = new THREE.BoxGeometry(0.38, 0.12, 0.1);
    const hlL = new THREE.Mesh(hlGeo, mats.headlightOn);
    hlL.position.set(-0.65, 0.55, 2.28);
    const hlR = hlL.clone();
    hlR.position.x = 0.65;
    car.add(hlL);
    car.add(hlR);
    headlights.push(hlL, hlR);

    [-0.65, 0.65].forEach(xOffset => {
      const spot = new THREE.SpotLight(0xffffff, 2.2, 45, Math.PI / 5, 0.3, 1.2);
      spot.position.set(xOffset, 0.6, 2.3);
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(xOffset, 0.2, 30);
      car.add(spot);
      car.add(spotTarget);
      spot.target = spotTarget;
      spotLights.push(spot);
    });

    // Continuous LED light bar at rear
    const tlBarGeo = new THREE.BoxGeometry(1.7, 0.08, 0.06);
    const tlBar = new THREE.Mesh(tlBarGeo, mats.taillightOn);
    tlBar.position.set(0, 0.58, -2.3);
    car.add(tlBar);
    taillights.push(tlBar);

    return { mesh: car, headlights, taillights, spotLights, mats };
  }

  // 4. Cyber SUV / Enforcer
  static buildSUV(mats) {
    const car = new THREE.Group();
    const headlights = [];
    const taillights = [];
    const spotLights = [];

    // High ground clearance rugged body
    const bodyGeo = new THREE.BoxGeometry(2.15, 0.7, 4.5);
    const bodyMesh = new THREE.Mesh(bodyGeo, mats.suvPaint);
    bodyMesh.position.set(0, 0.7, 0);
    bodyMesh.castShadow = true;
    car.add(bodyMesh);

    // Chunky cabin
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.7, 2.8);
    const cabinMesh = new THREE.Mesh(cabinGeo, mats.suvPaint);
    cabinMesh.position.set(0, 1.35, -0.3);
    cabinMesh.castShadow = true;
    car.add(cabinMesh);

    // Front Bullbar / Brush Guard
    const barGeo = new THREE.BoxGeometry(1.9, 0.45, 0.15);
    const barMesh = new THREE.Mesh(barGeo, mats.carbonFiber);
    barMesh.position.set(0, 0.55, 2.3);
    car.add(barMesh);

    // Roof Light Bar
    const roofBarGeo = new THREE.BoxGeometry(1.2, 0.12, 0.18);
    const roofBar = new THREE.Mesh(roofBarGeo, mats.headlightOn);
    roofBar.position.set(0, 1.76, 0.5);
    car.add(roofBar);
    headlights.push(roofBar);

    // Heavy Quad Headlights
    [-0.75, 0.75].forEach(x => {
      const hlGeo = new THREE.BoxGeometry(0.3, 0.22, 0.1);
      const hl = new THREE.Mesh(hlGeo, mats.headlightOn);
      hl.position.set(x, 0.65, 2.26);
      car.add(hl);
      headlights.push(hl);
    });

    [-0.75, 0.75].forEach(xOffset => {
      const spot = new THREE.SpotLight(0xffffff, 2.8, 55, Math.PI / 4.5, 0.3, 1.2);
      spot.position.set(xOffset, 0.8, 2.3);
      const spotTarget = new THREE.Object3D();
      spotTarget.position.set(xOffset, 0.2, 35);
      car.add(spot);
      car.add(spotTarget);
      spot.target = spotTarget;
      spotLights.push(spot);
    });

    // Tall vertical taillights
    [-0.9, 0.9].forEach(x => {
      const tlGeo = new THREE.BoxGeometry(0.12, 0.6, 0.08);
      const tl = new THREE.Mesh(tlGeo, mats.taillightOn);
      tl.position.set(x, 1.0, -2.25);
      car.add(tl);
      taillights.push(tl);
    });

    return { mesh: car, headlights, taillights, spotLights, mats };
  }
}
