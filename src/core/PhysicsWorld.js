import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    // Performance & stability solver settings
    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.05;
    this.world.defaultContactMaterial.contactEquationStiffness = 1e8;
    this.world.defaultContactMaterial.contactEquationRelaxation = 3;

    // Contact materials for vehicle wheels on asphalt
    this.groundMaterial = new CANNON.Material('ground');
    this.wheelMaterial = new CANNON.Material('wheel');

    const wheelGroundContact = new CANNON.ContactMaterial(
      this.wheelMaterial,
      this.groundMaterial,
      {
        friction: 0.85,
        restitution: 0.0,
        contactEquationStiffness: 1000000
      }
    );
    this.world.addContactMaterial(wheelGroundContact);

    // Create infinite/large ground plane
    this.createGround();
  }

  createGround() {
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
      material: this.groundMaterial
    });
    // Rotate to face upwards (Y-up)
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.world.addBody(groundBody);
  }

  addStaticBox(position, halfExtents) {
    const shape = new CANNON.Box(new CANNON.Vec3(halfExtents.x, halfExtents.y, halfExtents.z));
    const body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: shape,
      material: this.groundMaterial
    });
    this.world.addBody(body);
    return body;
  }

  step(delta) {
    // Clamp delta to avoid physics explosions on lag spikes
    const clampedDelta = Math.min(delta, 0.05);
    this.world.step(1 / 60, clampedDelta, 3);
  }
}
