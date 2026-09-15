export class Minimap {
  constructor(canvas, cityBuilder) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.city = cityBuilder;
    this.size = canvas.width;
    this.scale = 0.55;

    this.compassEl = document.getElementById('minimap-compass');

    // Fullscreen Map Modal Elements
    this.modal = document.getElementById('map-modal');
    this.fullCanvas = document.getElementById('fullscreen-map-canvas');
    this.fullCtx = this.fullCanvas ? this.fullCanvas.getContext('2d') : null;
    this.isMapOpen = false;
    this.mapZoom = 0.85;

    this.onTeleportCallback = null;

    this.setupListeners();
  }

  setupListeners() {
    // 1. Click on Radar Container or Canvas opens Fullscreen Map
    const container = document.querySelector('.minimap-container');
    if (container) {
      container.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreenMap(true);
      });
    }

    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreenMap(true);
      });
    }

    // 2. Open Map Button in Toolbar
    const btnOpenMap = document.getElementById('btn-open-map');
    if (btnOpenMap) {
      btnOpenMap.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreenMap(true);
      });
    }

    // 3. Close Button
    const closeBtn = document.getElementById('btn-close-map');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreenMap(false);
      });
    }

    // 4. Click on Backdrop to Close
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.toggleFullscreenMap(false);
        }
      });
    }

    // 5. ESC Key closes map
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMapOpen) {
        this.toggleFullscreenMap(false);
      }
    });

    // 6. Zoom Buttons
    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
      btnZoomIn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.mapZoom = Math.min(1.8, this.mapZoom + 0.2);
      });
    }

    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
      btnZoomOut.addEventListener('click', (e) => {
        e.stopPropagation();
        this.mapZoom = Math.max(0.45, this.mapZoom - 0.2);
      });
    }

    // 7. Fast Travel Teleport Buttons
    const setupTp = (id, targetPos) => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.onTeleportCallback) {
            this.onTeleportCallback(targetPos);
          }
          this.toggleFullscreenMap(false);
        });
      }
    };

    setupTp('btn-tp-airport', { x: 0, y: 0.38, z: -360, heading: 0 });
    setupTp('btn-tp-downtown', { x: 0, y: 0.38, z: 0, heading: 0 });
    setupTp('btn-tp-mall', { x: 0, y: 0.38, z: 350, heading: Math.PI });
  }

  onTeleport(callback) {
    this.onTeleportCallback = callback;
  }

  toggleFullscreenMap(forceState) {
    if (!this.modal) return;
    this.isMapOpen = (forceState !== undefined) ? forceState : !this.isMapOpen;

    if (this.isMapOpen) {
      this.modal.classList.remove('hidden');
    } else {
      this.modal.classList.add('hidden');
    }
    return this.isMapOpen;
  }

  update(playerPos, playerRotY, npcs = [], carPos = null) {
    // 1. Render Small Corner Radar
    this.renderSmallRadar(playerPos, playerRotY, npcs);

    // 2. Render Fullscreen GPS Map if active
    if (this.isMapOpen && this.fullCtx) {
      this.renderFullscreenMap(playerPos, playerRotY, carPos);
    }
  }

  renderSmallRadar(playerPos, playerRotY, npcs) {
    const ctx = this.ctx;
    const w = this.size;
    const h = this.size;
    const cx = w / 2;
    const cy = h / 2;

    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-playerRotY);

    if (this.compassEl) {
      const deg = Math.round((playerRotY * 180) / Math.PI) % 360;
      let heading = 'N';
      if (deg > 45 && deg <= 135) heading = 'E';
      else if (deg > 135 && deg <= 225) heading = 'S';
      else if (deg > 225 && deg <= 315) heading = 'W';
      this.compassEl.textContent = heading;
    }

    const ox = -playerPos.x * this.scale;
    const oz = -playerPos.z * this.scale;

    // Roads
    ctx.fillStyle = '#1e2634';
    if (this.city && this.city.roadSegments) {
      this.city.roadSegments.forEach(r => {
        const rx = r.x * this.scale + ox;
        const rz = r.z * this.scale + oz;
        const rw = r.w * this.scale;
        const rh = r.h * this.scale;
        ctx.fillRect(rx - rw / 2, rz - rh / 2, rw, rh);
      });
    }

    // Pedestrians (Yellow dots)
    ctx.fillStyle = '#ffcc00';
    npcs.forEach(npc => {
      if (!npc.group) return;
      const nx = npc.group.position.x * this.scale + ox;
      const nz = npc.group.position.z * this.scale + oz;
      if (Math.hypot(nx, nz) < cx - 6) {
        ctx.beginPath();
        ctx.arc(nx, nz, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();

    // Player Direction Arrow at Center
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Radar Ring
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, cx - 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderFullscreenMap(playerPos, playerRotY, carPos) {
    const ctx = this.fullCtx;
    const w = this.fullCanvas.width;
    const h = this.fullCanvas.height;

    // GPS Grid Background
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, w, h);

    const mapScale = this.mapZoom;
    const cx = w / 2;
    const cy = h / 2;

    // Grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // 1. Roads & Highways
    ctx.fillStyle = '#182232';
    if (this.city && this.city.roadSegments) {
      this.city.roadSegments.forEach(r => {
        const rx = r.x * mapScale + cx;
        const rz = r.z * mapScale + cy;
        const rw = r.w * mapScale;
        const rh = r.h * mapScale;
        ctx.fillRect(rx - rw / 2, rz - rh / 2, rw, rh);
      });
    }

    // 2. District Zones & Labels
    ctx.font = 'bold 15px Orbitron';

    // North: International Airport
    const airX = 20 * mapScale + cx;
    const airZ = -360 * mapScale + cy;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(airX - 110, airZ - 80, 220, 160);
    ctx.fillRect(airX - 110, airZ - 80, 220, 160);

    ctx.fillStyle = '#00f0ff';
    ctx.fillText('✈️ INTERNATIONAL AIRPORT', airX - 100, airZ - 90);

    // Center: Downtown Metropolis
    ctx.fillStyle = 'rgba(255, 170, 0, 0.08)';
    ctx.strokeStyle = '#ffaa00';
    ctx.strokeRect(cx - 100, cy - 100, 200, 200);
    ctx.fillRect(cx - 100, cy - 100, 200, 200);

    ctx.fillStyle = '#ffaa00';
    ctx.fillText('🏙️ DOWNTOWN METROPOLIS', cx - 90, cy - 110);

    // South: Grand Shopping Mall
    const mallZ = 350 * mapScale + cy;
    ctx.fillStyle = 'rgba(255, 0, 85, 0.08)';
    ctx.strokeStyle = '#ff0055';
    ctx.strokeRect(cx - 120, mallZ - 80, 240, 160);
    ctx.fillRect(cx - 120, mallZ - 80, 240, 160);

    ctx.fillStyle = '#ff0055';
    ctx.fillText('🛍️ GRAND SHOPPING MALL', cx - 100, mallZ - 90);

    // 3. Vehicle Marker
    if (carPos) {
      const carMx = carPos.x * mapScale + cx;
      const carMz = carPos.z * mapScale + cy;
      ctx.fillStyle = '#00ff88';
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(carMx, carMz, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Orbitron';
      ctx.fillText('VEHICLE', carMx + 9, carMz + 4);
    }

    // 4. Player Marker
    const pmx = playerPos.x * mapScale + cx;
    const pmz = playerPos.z * mapScale + cy;

    ctx.save();
    ctx.translate(pmx, pmz);
    ctx.rotate(playerRotY);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(7, 9);
    ctx.lineTo(0, 5);
    ctx.lineTo(-7, 9);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Orbitron';
    ctx.fillText('YOU', pmx + 12, pmz + 4);
  }
}
