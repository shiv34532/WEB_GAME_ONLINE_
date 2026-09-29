# 🚗 APEX CITY 3D - GTA Open World Web Game

A high-performance 3D Open World online PC game running in the browser with realistic physics, multiple drivable vehicles, animated human exploration, pedestrian AI, and interconnected city districts.

![WebGL](https://img.shields.io/badge/WebGL-Three.js-00f0ff?style=for-the-badge)
![Physics](https://img.shields.io/badge/Physics-Grounded%20Kinematic-00ff96?style=for-the-badge)
![FPS](https://img.shields.io/badge/Performance-60%2B%20FPS-ffaa00?style=for-the-badge)

---

## 🌟 Game Highlights

- 🏎️ **4 Drivable High-Detail Vehicles**:
  - **Exotic GT Supercar**: High speed, razor-sharp cornering, GT rear wing.
  - **V8 American Muscle**: Heavy torque, bulging hood scoop, drift slide.
  - **Luxury Sedan**: Balanced handling, smooth cruising.
  - **Cyber SUV**: High ride clearance, rugged urban capability.
- 🚶 **GTA Dual Player Mechanics**:
  - Enter and exit vehicles seamlessly at any time using **`[Key F]`**.
  - On-foot exploration as a 3D animated human character with walk, sprint, and jump mechanics.
- 🏙️ **3 Interconnected Open World Districts**:
  - **Downtown Metropolis**: Dense skyscrapers, street lights, 4-lane avenues.
  - **International Airport**: 400m landing runway, runway lighting, commercial jet aircraft, control tower.
  - **Grand Shopping Mall**: Glass atrium, outdoor parking lot, parked vehicles, walkways.
  - **Connecting Highway Network**: Multi-lane expressways linking all three zones.
- 🗺️ **Interactive Radar & Fullscreen GPS Map**:
  - Rotating minimap radar showing road networks and nearby pedestrians.
  - Fullscreen tactical GPS world map (`[Key M]`) with **Fast Travel Teleport Buttons** (`Airport`, `Downtown`, `Mall`) and zoom controls.
- 👥 **Intelligent Role-Based Pedestrians**:
  - **Civilians & Shoppers**: Casual wandering and shopping around malls.
  - **Police Officers**: Uniformed patrol with cap and gold badge.
  - **Business Travelers**: Formal suits and briefcases at airport and corporate centers.
  - Dynamic vehicle evasion AI and panic reactions.
- 🔊 **Procedural Web Audio Engine**:
  - Realistic engine acceleration revs, dynamic pitch modulation, tire screeches during drifts, and horn honking (`[Key H]`).
- ⚡ **60+ FPS Performance Optimization**:
  - ACESFilmic tone mapping, PCF soft shadows, day/night lighting modes (Golden Hour, High Noon, Cyberpunk Night), and GFX quality presets (`Smooth 60FPS`, `Ultra 4K`, `Max Performance`).

---

## 🎮 Controls Guide

| Action | Keyboard Key | On-Screen Touch / Mouse Button |
| :--- | :---: | :---: |
| **Accelerate Forward** | `W` or `↑` | `▲ DRIVE [W]` |
| **Foot Brake / Reverse** | `S` or `↓` | `▼ REVERSE [S]` |
| **Steer Left** | `A` or `←` | `◀ LEFT [A]` |
| **Steer Right** | `D` or `→` | `▶ RIGHT [D]` |
| **Handbrake / Drift / Jump** | `SPACE` | `🏎️ DRIFT [SPACE]` |
| **Exit / Enter Vehicle** | `F` | `🚪 EXIT / ENTER [F]` |
| **Fullscreen GPS World Map** | `M` or `ESC` | `🗺️ MAP [M]` |
| **Cycle Camera (Chase / Hood / Orbit / Top)** | `C` | `Cam [C]` |
| **Toggle Headlight Beams** | `L` | `Beam [L]` |
| **Honk Horn** | `H` | Keyboard |
| **Quick Switch Vehicles** | `1` - `4` | Vehicle Drawer (1-4) |
| **Respawn / Reset Position** | `R` | `Respawn [R]` |
| **Mute / Unmute Audio** | — | `🔊` |

---

## 🛠️ Technology Stack

- **Rendering**: [Three.js](https://threejs.org/) (WebGL, PBR MeshPhysicalMaterials, ACESFilmic Tone Mapping, PCFSoftShadowMap)
- **Physics**: Rock-solid Grounded Kinematic Vehicle Architecture + [Cannon-es](https://github.com/pmndrs/cannon-es)
- **Audio**: Web Audio API Procedural Synthesizers (no heavy MP3 assets required)
- **Build Tool**: [Vite](https://vitejs.dev/)

---

## 🚀 Getting Started

### Local Development

1. Clone the repository:
   ```bash
   git clone git@github.com:shiv34532/WEB_GAME_ONLINE_.git
   cd WEB_GAME_ONLINE_
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000/](http://localhost:3000/) in your web browser.

### Production Build

```bash
npm run build
```
Build files will be generated into the `dist/` directory.
This manly dedicated for Online Web Game Anthuthieste.


---

## 📄 License

MIT License. Open source and free for personal and educational use.
