import { Component, Suspense, forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import type { MutableRefObject, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import { Environment, useGLTF } from '@react-three/drei';
import { easing } from 'maath';
import * as THREE from 'three';

const MODEL_URL = '/models/plant.glb';
const SECTION_ONE_END = 0.33;
const SECTION_TWO_END = 0.66;
const DESKTOP_MODEL_X = 1.72;
const MOBILE_MODEL_X = 0.35;

type LoadedGLTF = {
  scene: THREE.Object3D;
};

type PlantSceneProps = {
  progressRef: MutableRefObject<number>;
};

type BoundaryProps = {
  children: ReactNode;
};

type BoundaryState = {
  hasError: boolean;
};

class SceneBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    console.error('Landing 3D scene error:', error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return null;
    }

    return this.props.children;
  }
}

function smootherstep(value: number, min: number, max: number): number {
  const x = THREE.MathUtils.clamp((value - min) / (max - min), 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function stagedValue(progress: number, first: number, second: number, third: number): number {
  const stageTwo = smootherstep(progress, SECTION_ONE_END, SECTION_TWO_END);
  const stageThree = smootherstep(progress, SECTION_TWO_END, 1);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(first, second, stageTwo), third, stageThree);
}

function centerAndNormalizeScene(scene: THREE.Object3D): THREE.Object3D {
  const normalized = scene.clone(true);
  const box = new THREE.Box3().setFromObject(normalized);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z, 1e-5);
  const scale = 2.04 / maxAxis;

  normalized.scale.setScalar(scale);
  normalized.position.copy(center).multiplyScalar(-scale);
  normalized.position.y -= size.y * scale * 0.36;

  return normalized;
}

function useSoftShadowTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;

    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(256, 128, 10, 256, 128, 238);
      gradient.addColorStop(0, 'rgba(15, 42, 31, 0.34)');
      gradient.addColorStop(0.48, 'rgba(15, 42, 31, 0.16)');
      gradient.addColorStop(1, 'rgba(15, 42, 31, 0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

type PlantModelProps = ThreeElements['group'];

const PlantModel = forwardRef<THREE.Group, PlantModelProps>(function PlantModel(props, forwardedRef) {
  const modelRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL) as LoadedGLTF;
  const normalizedScene = useMemo(() => centerAndNormalizeScene(scene), [scene]);

  useImperativeHandle(forwardedRef, () => modelRef.current as THREE.Group, []);

  return (
    <group ref={modelRef} {...props} dispose={null}>
      <primitive object={normalizedScene} />
    </group>
  );
});

function SceneContent({ progressRef }: PlantSceneProps) {
  const modelRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>>(null);
  const glowRef = useRef<THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const { camera, viewport } = useThree();
  const shadowTexture = useSoftShadowTexture();

  const neutralKey = useMemo(() => new THREE.Color('#fff5dc'), []);
  const brightKey = useMemo(() => new THREE.Color('#e2f4ff'), []);
  const warmKey = useMemo(() => new THREE.Color('#ffe0b8'), []);
  const neutralRim = useMemo(() => new THREE.Color('#dcefd1'), []);
  const warmRim = useMemo(() => new THREE.Color('#d8e1ff'), []);
  const mixedKey = useMemo(() => new THREE.Color(), []);
  const mixedRim = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const stageTwo = smootherstep(progress, SECTION_ONE_END, SECTION_TWO_END);
    const stageThree = smootherstep(progress, SECTION_TWO_END, 1);
    const isDesktop = viewport.width >= 6;
    const columnOffset = isDesktop ? DESKTOP_MODEL_X : MOBILE_MODEL_X;
    const parallaxProgress = progress * 0.6;

    const targetScale = stagedValue(progress, 0.82, 0.94, 1.04);
    const firstRotation = THREE.MathUtils.degToRad(8) * smootherstep(progress, 0, SECTION_ONE_END);
    const targetRotationY = firstRotation + THREE.MathUtils.degToRad(7) * stageTwo + THREE.MathUtils.degToRad(5) * stageThree;
    const targetRotationX = THREE.MathUtils.degToRad(10) * stageThree;
    const targetRotationZ = THREE.MathUtils.degToRad(4) * stageThree;
    const targetY = -0.12 + (0.5 - parallaxProgress) * 0.12;

    if (modelRef.current) {
      easing.damp3(modelRef.current.position, [columnOffset, targetY, 0], 0.25, delta);
      easing.damp3(modelRef.current.scale, [targetScale, targetScale, targetScale], 0.25, delta);
      easing.dampE(modelRef.current.rotation, [targetRotationX, targetRotationY, targetRotationZ], 0.25, delta);
    }

    if (shadowRef.current) {
      easing.damp3(shadowRef.current.position, [columnOffset, -1.02, -0.08], 0.25, delta);
      easing.damp3(shadowRef.current.scale, [targetScale * 1.04, targetScale * 1.04, targetScale * 1.04], 0.25, delta);
      shadowRef.current.material.opacity = THREE.MathUtils.lerp(
        shadowRef.current.material.opacity,
        THREE.MathUtils.lerp(0.2, 0.26, stageTwo),
        1 - Math.exp(-delta * 5)
      );
    }

    if (glowRef.current) {
      easing.damp3(glowRef.current.position, [columnOffset, 0.02, -1.2], 0.25, delta);
      easing.damp3(glowRef.current.scale, [2.4 + stageThree * 0.32, 2.4 + stageThree * 0.32, 2.4], 0.25, delta);
      glowRef.current.material.opacity = THREE.MathUtils.lerp(
        glowRef.current.material.opacity,
        THREE.MathUtils.lerp(0.1, 0.13, stageThree),
        1 - Math.exp(-delta * 5)
      );
    }

    easing.damp3(camera.position, [0, 0.04, stagedValue(progress, 5.85, 5.62, 5.42)], 0.28, delta);
    camera.lookAt(columnOffset * 0.45, -0.18, 0);

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        stagedValue(progress, 0.72, 0.84, 0.9),
        1 - Math.exp(-delta * 4)
      );
    }

    if (keyLightRef.current) {
      keyLightRef.current.intensity = THREE.MathUtils.lerp(
        keyLightRef.current.intensity,
        stagedValue(progress, 1.25, 1.72, 1.9),
        1 - Math.exp(-delta * 4)
      );
      mixedKey.lerpColors(neutralKey, brightKey, stageTwo * (1 - stageThree));
      mixedKey.lerp(warmKey, stageThree);
      keyLightRef.current.color.copy(mixedKey);
    }

    if (rimLightRef.current) {
      rimLightRef.current.intensity = THREE.MathUtils.lerp(
        rimLightRef.current.intensity,
        stagedValue(progress, 0.48, 0.62, 0.74),
        1 - Math.exp(-delta * 4)
      );
      mixedRim.lerpColors(neutralRim, warmRim, stageThree);
      rimLightRef.current.color.copy(mixedRim);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} intensity={0.72} />
      <directionalLight ref={keyLightRef} intensity={1.25} position={[4.6, 6.4, 5.2]} />
      <directionalLight ref={rimLightRef} intensity={0.48} position={[-5.4, 2.4, -4.8]} />
      <Environment preset="city" />

      <mesh ref={glowRef} position={[DESKTOP_MODEL_X, 0.02, -1.2]} renderOrder={-2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#8adfbc"
          transparent
          opacity={0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[DESKTOP_MODEL_X, -1.02, -0.08]} renderOrder={-1}>
        <planeGeometry args={[3.3, 1.34]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={0.2}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      <Suspense fallback={null}>
        <PlantModel ref={modelRef} position={[DESKTOP_MODEL_X, -0.12, 0]} />
      </Suspense>
    </>
  );
}

export function PlantScene({ progressRef }: PlantSceneProps) {
  return (
    <div className="pointer-events-none fixed left-0 top-0 z-0 h-screen w-screen">
      <SceneBoundary>
        <Canvas
          style={{ position: 'fixed', top: 0, left: 0, zIndex: 0, width: '100vw', height: '100vh' }}
          dpr={[1, 1.5]}
          camera={{ position: [0, 0.04, 5.85], fov: 35 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        >
          <SceneContent progressRef={progressRef} />
        </Canvas>
      </SceneBoundary>
    </div>
  );
}

useGLTF.preload(MODEL_URL);
