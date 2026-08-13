import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Global reactive state for dynamic background transitions
window.bgState = {
  scale: 60,
  targetScale: 60,
  twist: 1.2,
  targetTwist: 1.2,
  chaos: 0.6,
  targetChaos: 0.6,
  camX: 0,
  targetCamX: 0
};

export function initBackground(containerId = 'canvas-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const COUNT = 45000;
  const SPEED_MULT = 0.35;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.008);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
  camera.position.set(0, 0, 100);

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.strength = 1.8;
  bloomPass.radius = 0.4;
  bloomPass.threshold = 0.05;
  composer.addPass(bloomPass);

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const target = new THREE.Vector3();

  const geometry = new THREE.ConeGeometry(0.1, 0.5, 4).rotateX(Math.PI / 2);
  const material = new THREE.MeshBasicMaterial({ color: 0x00aaff });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, COUNT);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(instancedMesh);

  const positions = [];
  for (let i = 0; i < COUNT; i++) {
    positions.push(new THREE.Vector3((Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100, (Math.random() - 0.5) * 100));
    instancedMesh.setColorAt(i, color.setHex(0x00ff88));
  }

  const mouse = new THREE.Vector2(0, 0);
  const targetRotation = new THREE.Vector2(0, 0);

  window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime() * SPEED_MULT;

    const state = window.bgState;
    state.scale += (state.targetScale - state.scale) * 0.05;
    state.twist += (state.targetTwist - state.twist) * 0.05;
    state.chaos += (state.targetChaos - state.chaos) * 0.05;
    state.camX += (state.targetCamX - state.camX) * 0.05;

    camera.position.x = state.camX;

    targetRotation.x += (mouse.y * 0.3 - targetRotation.x) * 0.03;
    targetRotation.y += (mouse.x * 0.3 - targetRotation.y) * 0.03;

    instancedMesh.rotation.x = targetRotation.x;
    instancedMesh.rotation.y = targetRotation.y;

    const golden = 1.618033988749895;

    for (let i = 0; i < COUNT; i++) {
      const theta = i * golden * 6.283185307;
      const phi = Math.acos(1 - 2 * (i + 0.5) / COUNT);
      const radius = state.scale * (0.8 + 0.3 * Math.sin(time * 0.5 + i * 0.001));
      const rWarp = radius + state.chaos * 10 * Math.sin(theta * 3 + phi * 2 + time * 0.7);
      const thetaWarp = theta + state.twist * Math.sin(phi * 4 + time * 0.4);

      const x = rWarp * Math.sin(phi) * Math.cos(thetaWarp);
      const y = rWarp * Math.cos(phi);
      const z = rWarp * Math.sin(phi) * Math.sin(thetaWarp);

      const gx = x + state.chaos * 2 * Math.sin(y * 0.1 + time * 0.5);
      const gy = y + state.chaos * 1.5 * Math.sin(x * 0.08 + z * 0.06 + time * 0.3);
      const gz = z + state.chaos * 2 * Math.cos(x * 0.07 + y * 0.09 + time * 0.4);

      target.set(gx, gy, gz);

      const hue = (0.6 + 0.4 * Math.sin(theta * 0.5 + phi * 0.3 + time * 0.05)) % 1.0;
      const lightness = 0.4 + 0.4 * (0.5 + 0.5 * Math.sin(time * 0.2 + i * 0.0005));
      color.setHSL(hue, 0.85, Math.min(1, Math.max(0.2, lightness)));

      positions[i].lerp(target, 0.1);
      dummy.position.copy(positions[i]);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
      instancedMesh.setColorAt(i, color);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

    composer.render();
  }

  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
  });
}