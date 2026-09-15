export class HUD {
  constructor() {
    this.speedEl = document.getElementById('speed-val');
    this.gearEl = document.getElementById('gear-val');
    this.rpmBar = document.getElementById('rpm-bar');
    this.fpsEl = document.getElementById('fps-counter');

    this.driftBanner = document.getElementById('drift-banner');
    this.driftPointsEl = document.getElementById('drift-points');
    this.indDrift = document.getElementById('ind-drift');
    this.indLight = document.getElementById('ind-light');

    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.lastDriftScore = 0;
    this.driftTimeout = null;
  }

  update(vehicle, isHeadlightsOn) {
    if (!vehicle) return;

    // 1. Speed & Gear
    this.speedEl.textContent = vehicle.speedKmh;
    this.gearEl.textContent = vehicle.currentGear;

    // 2. RPM Bar (900 to 8000 RPM)
    const rpmPercent = Math.min(100, Math.max(5, ((vehicle.rpm - 900) / 7100) * 100));
    this.rpmBar.style.width = `${rpmPercent}%`;

    // 3. Indicators
    if (vehicle.isDrifting) {
      this.indDrift.classList.add('active');
    } else {
      this.indDrift.classList.remove('active');
    }

    if (isHeadlightsOn) {
      this.indLight.classList.add('active');
    } else {
      this.indLight.classList.remove('active');
    }

    // 4. Drift Banner
    if (vehicle.driftScore > this.lastDriftScore + 50) {
      this.driftPointsEl.textContent = `+${vehicle.driftScore} PTS`;
      this.driftBanner.classList.add('show');
      clearTimeout(this.driftTimeout);
      this.driftTimeout = setTimeout(() => {
        this.driftBanner.classList.remove('show');
      }, 1200);
    }
    this.lastDriftScore = vehicle.driftScore;

    // 5. FPS Counter
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.fpsEl.textContent = `${fps} FPS`;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
