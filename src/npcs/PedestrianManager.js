import * as THREE from 'three';
import { Pedestrian } from './Pedestrian.js';

export class PedestrianManager {
  constructor(scene, sidewalkWaypoints, count = 40) {
    this.scene = scene;
    this.waypoints = sidewalkWaypoints;
    this.pedestrians = [];

    this.spawnPopulation(count);
  }

  spawnPopulation(count) {
    if (!this.waypoints || this.waypoints.length === 0) return;

    for (let i = 0; i < count; i++) {
      const randWp = this.waypoints[Math.floor(Math.random() * this.waypoints.length)];
      const spawnPos = randWp.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        0,
        (Math.random() - 0.5) * 3
      ));

      // Distribute 3 Roles
      let role = 'civilian';
      const rand = Math.random();
      if (rand < 0.25) {
        role = 'police'; // 25% Police Officers
      } else if (rand < 0.5) {
        role = 'business'; // 25% Business / Travelers
      } else {
        role = 'civilian'; // 50% Civilians / Shoppers
      }

      const ped = new Pedestrian(this.scene, spawnPos, this.waypoints, role);
      this.pedestrians.push(ped);
    }
  }

  scareNearbyPedestrians(pos, radius = 30) {
    this.pedestrians.forEach(p => {
      if (p.group.position.distanceTo(pos) < radius) {
        p.panic();
      }
    });
  }

  update(delta, playerPos, playerSpeed) {
    this.pedestrians.forEach(ped => {
      ped.update(delta, playerPos, playerSpeed);
    });
  }
}
