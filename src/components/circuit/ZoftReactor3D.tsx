import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { useRealtimeStore } from '../../lib/realtimeStore';
import { calculateJoinSplit } from '../../lib/math';

export type ReactorTier = 'hero' | 'compact' | 'lab';

interface ZoftReactor3DProps {
  tier?: ReactorTier;
  interactiveControls?: boolean;
  caption?: string;
}

// Pre-allocated scratch math objects at module scope (zero GC in render loop)
const _tempMatrix = new THREE.Matrix4();
const _tempPos = new THREE.Vector3();
const _tempScale = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _unitAxis = new THREE.Vector3(0.35, 0.85, 0.39).normalize();
const _tempColor = new THREE.Color();

function detectSoftwareGl(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export const ZoftReactor3D: React.FC<ZoftReactor3DProps> = ({
  tier = 'hero',
  interactiveControls = true,
  caption,
}) => {
  const {
    circuitConfig,
    updateCircuitConfig,
    proofPulseCounter,
    triggerProofPulse,
    reducedMotion,
  } = useRealtimeStore();

  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(tier === 'compact');
  const [cameraPreset, setCameraPreset] = useState<'iso' | 'top' | 'front'>('iso');

  // Mutable ref so the Three.js loop always reads fresh state without tearing down the canvas
  const stateRef = useRef({
    splitPercent: circuitConfig.withdrawalSplitPercent,
    noteCount: circuitConfig.selectedNoteIds.length,
    batchSize: circuitConfig.solverBatchSizePreview,
    pulseCounter: proofPulseCounter,
    reducedMotion,
    cameraPreset,
    pointerX: 0,
    pointerY: 0,
  });

  useEffect(() => {
    stateRef.current.splitPercent = circuitConfig.withdrawalSplitPercent;
    stateRef.current.noteCount = circuitConfig.selectedNoteIds.length;
    stateRef.current.batchSize = circuitConfig.solverBatchSizePreview;
    stateRef.current.pulseCounter = proofPulseCounter;
    stateRef.current.reducedMotion = reducedMotion;
    stateRef.current.cameraPreset = cameraPreset;
  }, [
    circuitConfig.withdrawalSplitPercent,
    circuitConfig.selectedNoteIds.length,
    circuitConfig.solverBatchSizePreview,
    proofPulseCounter,
    reducedMotion,
    cameraPreset,
  ]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: false,
      });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x08090c, 1);

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 340;
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08090c);
    scene.fog = new THREE.FogExp2(0x08090c, 0.055);

    // Studio PBR environment reflections via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 3.3, 6.6);
    camera.lookAt(0, 0.1, 0);

    // Balanced 3-point studio lighting with warm key, cool hemisphere fill, and Robinhood emerald rim
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x070709, 0.65);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4e6, 2.2);
    keyLight.position.set(4.5, 7.5, 5.0);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 20;
      const d = 4.5;
      keyLight.shadow.camera.left = -d;
      keyLight.shadow.camera.right = d;
      keyLight.shadow.camera.top = d;
      keyLight.shadow.camera.bottom = -d;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00c805, 1.45);
    rimLight.position.set(-5.0, 3.0, -4.5);
    scene.add(rimLight);

    // Root composite group (10 distinct procedural parts)
    const reactorGroup = new THREE.Group();
    scene.add(reactorGroup);

    // Part 1: Soft radial contact shadow grounding plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 6, 64, 64, 62);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.78)');
      grad.addColorStop(0.55, 'rgba(0, 200, 5, 0.12)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const contactShadowGeo = new THREE.CircleGeometry(3.2, 32);
    const contactShadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.85,
    });
    const contactShadow = new THREE.Mesh(contactShadowGeo, contactShadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = -1.18;
    reactorGroup.add(contactShadow);

    // Part 2: Lower metallic pedestal base
    const pedestalGeo = new THREE.CylinderGeometry(2.35, 2.55, 0.24, 32);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x12141b,
      roughness: 0.35,
      metalness: 0.88,
    });
    const pedestalMesh = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestalMesh.position.y = -1.04;
    pedestalMesh.receiveShadow = true;
    reactorGroup.add(pedestalMesh);

    // Part 3: U-shaped monolithic base in gunmetal (#181920) via ExtrudeGeometry with bevels
    const uShape = new THREE.Shape();
    uShape.moveTo(-2.1, -0.85);
    uShape.lineTo(2.1, -0.85);
    uShape.lineTo(2.1, 0.75);
    uShape.lineTo(1.52, 0.75);
    uShape.lineTo(1.52, -0.32);
    uShape.lineTo(-1.52, -0.32);
    uShape.lineTo(-1.52, 0.75);
    uShape.lineTo(-2.1, 0.75);
    uShape.closePath();

    const uGeo = new THREE.ExtrudeGeometry(uShape, {
      depth: 1.5,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.06,
      bevelThickness: 0.06,
    });
    uGeo.center();
    const uMat = new THREE.MeshStandardMaterial({
      color: 0x181920,
      roughness: 0.68,
      metalness: 0.78,
    });
    const uBaseMesh = new THREE.Mesh(uGeo, uMat);
    uBaseMesh.position.set(0, -0.15, 0);
    uBaseMesh.castShadow = true;
    uBaseMesh.receiveShadow = true;
    reactorGroup.add(uBaseMesh);

    // Part 4: White + Robinhood Emerald Intent Output Bar (scales dynamically with split %)
    const barUnitGeo = new THREE.BoxGeometry(1, 0.44, 0.92);
    const intentBarMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x00c805,
      emissiveIntensity: 0.14,
      roughness: 0.18,
      metalness: 0.35,
    });
    const intentBarMesh = new THREE.Mesh(barUnitGeo, intentBarMat);
    intentBarMesh.position.set(-0.5, -0.22, 0);
    intentBarMesh.castShadow = true;
    reactorGroup.add(intentBarMesh);

    // Part 5: Shielded Change Bar in graphite (#272a36)
    const changeBarMat = new THREE.MeshStandardMaterial({
      color: 0x262936,
      roughness: 0.58,
      metalness: 0.65,
    });
    const changeBarMesh = new THREE.Mesh(barUnitGeo, changeBarMat);
    changeBarMesh.position.set(0.8, -0.22, 0);
    changeBarMesh.castShadow = true;
    reactorGroup.add(changeBarMesh);

    // Part 6: Precision Split Divider Blade
    const bladeGeo = new THREE.BoxGeometry(0.07, 0.68, 1.14);
    const bladeMat = new THREE.MeshStandardMaterial({
      color: 0x00c805,
      emissive: 0x00c805,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.8,
    });
    const bladeMesh = new THREE.Mesh(bladeGeo, bladeMat);
    bladeMesh.position.set(0.2, -0.18, 0);
    reactorGroup.add(bladeMesh);

    // Part 7: Floating Octahedral ZK / x402 Crystal (core + outer wireframe cage)
    const crystalGroup = new THREE.Group();
    crystalGroup.position.set(0, 0.95, 0);
    reactorGroup.add(crystalGroup);

    const crystalGeo = new THREE.OctahedronGeometry(0.56, 0);
    const crystalMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2f8ec,
      emissive: 0x00c805,
      emissiveIntensity: 0.22,
      metalness: 0.15,
      roughness: 0.12,
      transmission: isSoftwareGl ? 0 : 0.88,
      transparent: true,
      opacity: isSoftwareGl ? 0.82 : 1.0,
      ior: 1.6,
      thickness: 1.2,
      clearcoat: 1.0,
    });
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    crystalGroup.add(crystalMesh);

    const cageGeo = new THREE.OctahedronGeometry(0.68, 0);
    const cageMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      roughness: 0.3,
      metalness: 0.9,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    crystalGroup.add(cageMesh);

    // Part 8 & 9: Dual Orbital Rings (LayerZero V2 lzRead + Robinhood Chain x402 Facilitator)
    const innerRingGeo = new THREE.TorusGeometry(1.22, 0.024, 16, 64);
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.32,
      roughness: 0.28,
      metalness: 0.85,
    });
    const innerRingMesh = new THREE.Mesh(innerRingGeo, innerRingMat);
    innerRingMesh.position.y = 0.85;
    innerRingMesh.rotation.x = Math.PI / 2.6;
    reactorGroup.add(innerRingMesh);

    const outerRingGeo = new THREE.TorusGeometry(1.58, 0.02, 16, 64);
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x00c805,
      emissive: 0x00c805,
      emissiveIntensity: 0.38,
      roughness: 0.25,
      metalness: 0.88,
    });
    const outerRingMesh = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRingMesh.position.y = 0.85;
    outerRingMesh.rotation.x = -Math.PI / 3.1;
    reactorGroup.add(outerRingMesh);

    // Part 10: ASP Base Halo + Event Shockwave Ring + Instanced Commitment Satellites
    const haloGeo = new THREE.RingGeometry(1.85, 2.02, 48);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.y = -0.9;
    reactorGroup.add(haloMesh);

    const shockwaveGeo = new THREE.RingGeometry(0.6, 0.78, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0x00c805,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.0,
      depthWrite: false,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    shockwaveMesh.rotation.x = -Math.PI / 2;
    shockwaveMesh.position.y = -0.86;
    reactorGroup.add(shockwaveMesh);

    const maxSatellites = tier === 'lab' ? 24 : tier === 'hero' ? 14 : 10;
    const satGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
    const satMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.85,
    });
    const satellitesInstanced = new THREE.InstancedMesh(satGeo, satMat, maxSatellites);
    satellitesInstanced.frustumCulled = false;
    for (let i = 0; i < maxSatellites; i++) {
      _tempColor.setHex(i % 3 === 0 ? 0x00c805 : i % 2 === 0 ? 0xf4f4f6 : 0x38bdf8);
      satellitesInstanced.setColorAt(i, _tempColor);
    }
    satellitesInstanced.computeBoundingSphere();
    reactorGroup.add(satellitesInstanced);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Pointer interaction for subtle tactile tilt
    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      stateRef.current.pointerX = nx;
      stateRef.current.pointerY = ny;
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });

    // ResizeObserver for bounded container responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.max(200, Math.floor(entry.contentRect.width));
        const h = Math.max(180, Math.floor(entry.contentRect.height));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    let frameId = 0;
    let isDisposed = false;
    let currentSplit = stateRef.current.splitPercent / 100;
    let lastPulseSeen = stateRef.current.pulseCounter;
    let pulseEnergy = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isDisposed) return;
      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // Detect new proof / x402 payment event
      if (st.pulseCounter !== lastPulseSeen) {
        lastPulseSeen = st.pulseCounter;
        pulseEnergy = 1.0;
      }
      if (pulseEnergy > 0.001) {
        pulseEnergy = Math.max(0, pulseEnergy - dt * 1.15);
      }

      // Smooth exponential damping for split bar geometry
      const targetSplit = THREE.MathUtils.clamp(st.splitPercent / 100, 0.04, 0.96);
      currentSplit = THREE.MathUtils.damp(currentSplit, targetSplit, 9, dt);

      const totalInnerSpan = 2.86;
      const gap = 0.12;
      const usableSpan = totalInnerSpan - gap;
      const intentWidth = Math.max(0.12, usableSpan * currentSplit);
      const changeWidth = Math.max(0.12, usableSpan * (1 - currentSplit));

      const leftEdge = -totalInnerSpan / 2;
      intentBarMesh.scale.x = intentWidth;
      intentBarMesh.position.x = leftEdge + intentWidth / 2;

      const bladeX = leftEdge + intentWidth + gap / 2;
      bladeMesh.position.x = bladeX;

      changeBarMesh.scale.x = changeWidth;
      changeBarMesh.position.x = bladeX + gap / 2 + changeWidth / 2;

      // Camera preset smooth interpolation
      let camTargetX = 0;
      let camTargetY = 3.3;
      let camTargetZ = 6.6;
      if (st.cameraPreset === 'top') {
        camTargetX = 0;
        camTargetY = 6.8;
        camTargetZ = 1.8;
      } else if (st.cameraPreset === 'front') {
        camTargetX = 0;
        camTargetY = 1.5;
        camTargetZ = 7.1;
      }
      camera.position.x = THREE.MathUtils.damp(
        camera.position.x,
        camTargetX + st.pointerX * 0.65,
        6,
        dt
      );
      camera.position.y = THREE.MathUtils.damp(
        camera.position.y,
        camTargetY - st.pointerY * 0.35,
        6,
        dt
      );
      camera.position.z = THREE.MathUtils.damp(camera.position.z, camTargetZ, 6, dt);
      camera.lookAt(0, 0.12, 0);

      // Motion updates (respecting reducedMotion)
      const motionSpeed = st.reducedMotion ? 0 : 1 + pulseEnergy * 3.2;
      crystalGroup.rotation.y += dt * 0.65 * motionSpeed;
      crystalGroup.rotation.x = Math.sin(elapsed * 1.4) * 0.15 * (st.reducedMotion ? 0 : 1);
      crystalGroup.position.y =
        0.95 + Math.sin(elapsed * 2.1) * 0.08 * (st.reducedMotion ? 0 : 1);

      const crystalScale = 1 + pulseEnergy * 0.24 + st.noteCount * 0.03;
      crystalGroup.scale.setScalar(crystalScale);

      innerRingMesh.rotation.z += dt * 0.55 * motionSpeed;
      outerRingMesh.rotation.z -= dt * 0.42 * motionSpeed;

      // Shockwave expansion on proof/payment simulation
      if (pulseEnergy > 0.01) {
        const waveScale = 1 + (1 - pulseEnergy) * 2.6;
        shockwaveMesh.scale.setScalar(waveScale);
        shockwaveMat.opacity = pulseEnergy * 0.75;
      } else {
        shockwaveMat.opacity = 0;
      }

      // Update commitment satellites
      const activeSatCount = Math.min(
        maxSatellites,
        Math.max(4, st.noteCount * 3 + Math.round(st.batchSize / 2))
      );
      for (let i = 0; i < maxSatellites; i++) {
        if (i < activeSatCount) {
          const angle =
            (i / activeSatCount) * Math.PI * 2 +
            (st.reducedMotion ? 0 : elapsed * 0.48 * (i % 2 === 0 ? 1 : -0.8));
          const radius = 1.65 + (i % 3) * 0.28;
          const yOff = 0.45 + Math.sin(elapsed * 1.8 + i) * 0.25 * (st.reducedMotion ? 0 : 1);
          _tempPos.set(Math.cos(angle) * radius, yOff, Math.sin(angle) * radius);
          _tempQuat.setFromAxisAngle(_unitAxis, elapsed * 1.2 + i);
          const s = 0.75 + (i % 3) * 0.14 + pulseEnergy * 0.25;
          _tempScale.set(s, s, s);
          _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
        } else {
          _tempPos.set(0, -10, 0);
          _tempQuat.identity();
          _tempScale.set(0.0001, 0.0001, 0.0001);
          _tempMatrix.compose(_tempPos, _tempQuat, _tempScale);
        }
        satellitesInstanced.setMatrixAt(i, _tempMatrix);
      }
      satellitesInstanced.instanceMatrix.needsUpdate = true;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isDisposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      envTexture.dispose();
      shadowTex.dispose();
      contactShadowGeo.dispose();
      contactShadowMat.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      uGeo.dispose();
      uMat.dispose();
      barUnitGeo.dispose();
      intentBarMat.dispose();
      changeBarMat.dispose();
      bladeGeo.dispose();
      bladeMat.dispose();
      crystalGeo.dispose();
      crystalMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      innerRingGeo.dispose();
      innerRingMat.dispose();
      outerRingGeo.dispose();
      outerRingMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      shockwaveGeo.dispose();
      shockwaveMat.dispose();
      satGeo.dispose();
      satMat.dispose();
      renderer.dispose();
    };
  }, [tier]);

  const splitMath = calculateJoinSplit(
    circuitConfig.amountInput,
    circuitConfig.withdrawalSplitPercent
  );

  const heightClass =
    tier === 'lab'
      ? 'h-[360px] sm:h-[420px]'
      : tier === 'hero'
        ? 'h-[250px] sm:h-[320px] lg:h-[370px]'
        : 'h-[230px] sm:h-[290px]';

  return (
    <div
      className={`relative w-full ${heightClass} rounded-2xl bg-[#08090c] border border-white/10 overflow-hidden select-none`}
      data-testid={`zoft-reactor-${tier}`}
      role="region"
      aria-label={`3D Noir Join-Split and x402 Reactor: ${circuitConfig.withdrawalSplitPercent}% Intent Output (${splitMath.intentFormatted} ${circuitConfig.assetId || 'USDG'}) and ${100 - circuitConfig.withdrawalSplitPercent}% Shielded Change (${splitMath.changeFormatted} ${circuitConfig.assetId || 'USDG'})`}
    >
      {/* Dedicated WebGL Mount Container */}
      {!webglFailed ? (
        <div ref={canvasMountRef} className="w-full h-full" />
      ) : (
        /* Static 2D SVG Visualizer Fallback with live settlement bar proportions */
        <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-[#08090c]">
          <svg
            viewBox="0 0 360 160"
            className="w-full max-w-[320px] h-auto"
            aria-hidden="true"
          >
            <rect
              x="20"
              y="30"
              width="320"
              height="100"
              rx="14"
              fill="#181920"
              stroke="rgba(255,255,255,0.16)"
            />
            <rect
              x="36"
              y="62"
              width={Math.max(16, (288 * circuitConfig.withdrawalSplitPercent) / 100 - 4)}
              height="36"
              rx="6"
              fill="#f4f4f6"
            />
            <rect
              x={36 + (288 * circuitConfig.withdrawalSplitPercent) / 100}
              y="62"
              width={Math.max(
                12,
                (288 * (100 - circuitConfig.withdrawalSplitPercent)) / 100 - 4
              )}
              height="36"
              rx="6"
              fill="#272a36"
            />
            <rect
              x={33 + (288 * circuitConfig.withdrawalSplitPercent) / 100}
              y="50"
              width="6"
              height="60"
              rx="3"
              fill="#00C805"
            />
          </svg>
          <p className="text-xs text-[#a1a1aa] mt-2 font-mono">
            2D Gateway Fallback · {circuitConfig.withdrawalSplitPercent}% $AUTONOMO /{' '}
            {100 - circuitConfig.withdrawalSplitPercent}% USDG
          </p>
        </div>
      )}

      {/* Top-Left Minimal Spec Overlay (Single-line, Pure x402 Settlement Mix) */}
      <div className="pointer-events-none absolute top-3 left-3.5 right-3.5 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0d0e12]/90 border border-white/10 text-[11px] font-mono text-[#d4d4d8] whitespace-nowrap shrink-0">
          <span className="text-[#00C805] font-semibold">3D x402 Engine</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">
            {circuitConfig.withdrawalSplitPercent}% $AUTONOMO /{' '}
            {100 - circuitConfig.withdrawalSplitPercent}% USDG
          </span>
        </div>

        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0d0e12]/90 border border-white/10 text-[11px] font-mono text-[#a1a1aa] whitespace-nowrap shrink-0">
          <span>HTTP 402</span>
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock */}
      {interactiveControls && (
        <div className="
          absolute bottom-2.5 left-1/2 -translate-x-1/2
          w-[94%] max-w-[460px] z-10
        ">
          <div className="flex justify-center mb-1">
            <button
              type="button"
              onClick={() => setDockCollapsed((v) => !v)}
              className="px-2.5 py-0.5 rounded-t-md bg-[#0d0e12] border border-b-0 border-white/15 text-[11px] font-mono text-[#a1a1aa] hover:text-white transition-colors whitespace-nowrap"
              aria-expanded={!dockCollapsed}
              aria-label={dockCollapsed ? 'Show 3D gateway controls' : 'Hide 3D gateway controls'}
            >
              {dockCollapsed ? '▴ Show 3D Controls' : '▾ Hide 3D Controls'}
            </button>
          </div>

          {!dockCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-[#0d0e12]/95 border border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                <label
                  htmlFor={`reactor-split-${tier}`}
                  className="text-[11px] font-mono text-[#a1a1aa] whitespace-nowrap"
                >
                  Token Mix {circuitConfig.withdrawalSplitPercent}%
                </label>
                <input
                  id={`reactor-split-${tier}`}
                  type="range"
                  min={5}
                  max={95}
                  step={1}
                  value={circuitConfig.withdrawalSplitPercent}
                  onChange={(e) =>
                    updateCircuitConfig({
                      withdrawalSplitPercent: Number(e.target.value),
                    })
                  }
                  className="w-full accent-[#00C805] cursor-pointer h-1.5 bg-[#20232b] rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1">
                {(['iso', 'top', 'front'] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => setCameraPreset(view)}
                    className={`px-2 py-1 rounded text-[11px] font-mono uppercase transition-colors whitespace-nowrap ${
                      cameraPreset === view
                        ? 'bg-white text-[#070709] font-semibold'
                        : 'text-[#a1a1aa] hover:text-white bg-[#161820]'
                    }`}
                  >
                    {view}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={triggerProofPulse}
                  className="ml-1 px-2.5 py-1 rounded bg-[#00C805] text-[#070709] font-semibold text-[11px] hover:bg-[#10b981] transition-colors whitespace-nowrap"
                >
                  Simulate 402 Call
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {caption && !interactiveControls && (
        <div className="pointer-events-none absolute bottom-2.5 left-3.5 right-3.5 text-[11px] font-mono text-[#a1a1aa] truncate">
          {caption}
        </div>
      )}
    </div>
  );
};
