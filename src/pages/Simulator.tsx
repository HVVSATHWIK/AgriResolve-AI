import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMobile } from '../hooks/useMobile';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play, Pause, RefreshCw, Droplets, Sprout, Wind, ThermometerSun, ChevronRight, Layers } from 'lucide-react';
import { AgriTwinEngine } from '../features/agritwin/engine';
import { SoilHealthCard, SimulationState, CROP_LIBRARY, CropType } from '../features/agritwin/types';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, PointerLockControls, Stars, Cloud } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, TiltShift2, Noise } from '@react-three/postprocessing';
import { AgriTwinMark } from '../components/AgriTwinMark';

const AGRITWIN_VISIBLE_CROPS: CropType[] = ['WHEAT', 'MAIZE', 'COTTON', 'CHILLI'];

const createCurvedBladeGeometry = (width: number, height: number, bend: number, lift: number) => {
    const geometry = new THREE.PlaneGeometry(width, height, 1, 7);
    const positions = geometry.attributes.position;

    for (let i = 0; i < positions.count; i++) {
        const normalizedHeight = (positions.getY(i) + (height / 2)) / height;
        positions.setX(i, positions.getX(i) + Math.sin(normalizedHeight * Math.PI) * bend);
        positions.setZ(i, positions.getZ(i) + normalizedHeight * normalizedHeight * lift);
    }

    geometry.translate(width * 0.2, height * 0.5, 0);
    geometry.computeVertexNormals();
    return geometry;
};

const RainSystem: React.FC<{ count: number, active: boolean }> = ({ count, active }) => {
    const rainGeo = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) positions[i] = (Math.random() - 0.5) * 100;
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geo;
    }, [count]);

    const rainMat = useMemo(() => new THREE.PointsMaterial({
        color: 0xaaaaaa, size: 0.1, transparent: true, opacity: 0.8
    }), []);

    const ref = useRef<THREE.Points>(null);
    useFrame((_, delta) => {
        if (!ref.current || !active) return;
        const positions = ref.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < count * 3; i += 3) {
            positions[i] -= 20 * delta; // Fall speed
            if (positions[i] < 0) positions[i] = 50; // Reset height
        }
        ref.current.geometry.attributes.position.needsUpdate = true;
    });

    if (!active) return null;
    return <points ref={ref} geometry={rainGeo} material={rainMat} />;
};

const FieldInstanceRenderer: React.FC<{ state: SimulationState, isMobile: boolean }> = ({ state, isMobile }) => {
    const stemRef = useRef<THREE.InstancedMesh>(null);
    const foliageRef = useRef<THREE.InstancedMesh>(null);
    const fruitRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const stemColor = useMemo(() => new THREE.Color(), []);
    const foliageColor = useMemo(() => new THREE.Color(), []);
    const fruitColor = useMemo(() => new THREE.Color(), []);
    const stressColor = useMemo(() => new THREE.Color('#8d6e63'), []);

    const { COUNT, GRID_SIZE, plantJitter, groundDry, groundWet, stemGeo, foliageGeo, fruitGeo } = useMemo(() => {
        let count = isMobile ? 900 : 2500;
        let gridSize = 58;
        let jitter = 0.35;
        let dry = '#4b2f1f';
        let wet = '#2b241b';
        let stemGeometry: THREE.BufferGeometry = new THREE.CylinderGeometry(0.012, 0.02, 1.1, 6);
        let foliageGeometry: THREE.BufferGeometry = createCurvedBladeGeometry(0.11, 0.92, 0.14, 0.12);
        let fruitGeometry: THREE.BufferGeometry = new THREE.CylinderGeometry(0.03, 0.055, 0.42, 6);

        if (state.crop.type === 'MAIZE') {
            count = isMobile ? 144 : 289;
            gridSize = 88;
            jitter = 1.15;
            dry = '#66452b';
            wet = '#3d3424';
            stemGeometry = new THREE.CylinderGeometry(0.05, 0.085, 2.1, 8);
            foliageGeometry = createCurvedBladeGeometry(0.24, 1.45, 0.36, 0.26);
            fruitGeometry = new THREE.CylinderGeometry(0.09, 0.11, 0.52, 10);

            stemGeometry.translate(0, 1.05, 0);
            foliageGeometry.rotateY(Math.PI / 2);
            foliageGeometry.translate(0.2, 0.28, 0);
            fruitGeometry.rotateZ(-0.45);
            fruitGeometry.translate(0.28, 1.0, 0);
        } else if (state.crop.type === 'COTTON') {
            count = isMobile ? 100 : 196;
            gridSize = 92;
            jitter = 1.55;
            dry = '#5b3a26';
            wet = '#3a2e24';
            stemGeometry = new THREE.CylinderGeometry(0.03, 0.048, 0.95, 7);
            foliageGeometry = new THREE.SphereGeometry(0.34, 8, 8);
            fruitGeometry = new THREE.IcosahedronGeometry(0.14, 0);

            stemGeometry.translate(0, 0.48, 0);
            foliageGeometry.scale(1.12, 0.88, 1.12);
            foliageGeometry.translate(0, 0.78, 0);
            fruitGeometry.translate(0.18, 0.86, 0.08);
        } else if (state.crop.type === 'CHILLI') {
            count = isMobile ? 144 : 256;
            gridSize = 80;
            jitter = 0.95;
            dry = '#603b28';
            wet = '#423127';
            stemGeometry = new THREE.CylinderGeometry(0.022, 0.036, 0.82, 7);
            foliageGeometry = new THREE.SphereGeometry(0.28, 8, 8);
            fruitGeometry = new THREE.CapsuleGeometry(0.028, 0.22, 5, 10);

            stemGeometry.translate(0, 0.41, 0);
            foliageGeometry.scale(1.0, 1.28, 0.9);
            foliageGeometry.translate(0, 0.6, 0);
            fruitGeometry.rotateZ(-0.65);
            fruitGeometry.translate(0.18, 0.54, 0.04);
        } else {
            stemGeometry.translate(0, 0.55, 0);
            foliageGeometry.rotateY(Math.PI / 4);
            fruitGeometry.rotateZ(0.12);
            fruitGeometry.translate(0.02, 1.02, 0);
        }

        return {
            COUNT: count,
            GRID_SIZE: gridSize,
            plantJitter: jitter,
            groundDry: dry,
            groundWet: wet,
            stemGeo: stemGeometry,
            foliageGeo: foliageGeometry,
            fruitGeo: fruitGeometry
        };
    }, [state.crop.type, isMobile]);

    const plantNoise = useMemo(() => {
        const noise = new Float32Array(COUNT * 5);
        for (let i = 0; i < COUNT; i++) {
            const index = i * 5;
            noise[index] = Math.random() - 0.5;
            noise[index + 1] = Math.random() - 0.5;
            noise[index + 2] = 0.82 + (Math.random() * 0.45);
            noise[index + 3] = Math.random() * Math.PI * 2;
            noise[index + 4] = 0.85 + (Math.random() * 0.3);
        }
        return noise;
    }, [COUNT]);

    useFrame((renderState) => {
        const time = renderState.clock.getElapsedTime();
        const crop = state.crop;
        const sqrtCount = Math.sqrt(COUNT);
        const stageFactor = THREE.MathUtils.clamp(0.28 + (crop.dvs * 0.58), 0.25, 1.45);
        const heightFactor = THREE.MathUtils.clamp((crop.height / 90) + stageFactor, 0.25, 2.2);
        const stressDrop = THREE.MathUtils.clamp(state.stress.water * 0.18, 0, 0.16);

        let idx = 0;
        for (let x = 0; x < sqrtCount; x++) {
            for (let z = 0; z < sqrtCount; z++) {
                const noiseIndex = idx * 5;
                const offsetX = plantNoise[noiseIndex] * plantJitter;
                const offsetZ = plantNoise[noiseIndex + 1] * plantJitter;
                const vigor = plantNoise[noiseIndex + 2];
                const phase = plantNoise[noiseIndex + 3];
                const leanBias = plantNoise[noiseIndex + 4];
                const xPos = ((x / sqrtCount) * GRID_SIZE) - (GRID_SIZE / 2) + offsetX;
                const zPos = ((z / sqrtCount) * GRID_SIZE) - (GRID_SIZE / 2) + offsetZ;
                const wave = Math.sin((time * 1.2) + phase + (xPos * 0.08) + (zPos * 0.11));
                const windLean = wave * 0.08 * leanBias;
                const yaw = phase * 0.3;

                let stemScaleX = 1;
                let stemScaleY = 0.9;
                let stemScaleZ = 1;
                let foliageScaleX = 1;
                let foliageScaleY = 1;
                let foliageScaleZ = 1;
                let fruitScaleX = 0;
                let fruitScaleY = 0;
                let fruitScaleZ = 0;
                let foliagePitch = windLean * 1.4;
                let fruitPitch = windLean * 0.8;

                if (crop.type === 'WHEAT') {
                    stemScaleX = 0.92;
                    stemScaleY = heightFactor * (0.78 + (vigor * 0.28));
                    stemScaleZ = 0.92;
                    foliageScaleX = 0.95 + (vigor * 0.08);
                    foliageScaleY = heightFactor * (0.84 + (vigor * 0.18));
                    foliageScaleZ = 0.95;
                    fruitScaleX = crop.dvs > 0.95 ? 0.88 : 0;
                    fruitScaleY = crop.dvs > 0.95 ? 0.65 + (crop.dvs * 0.35) : 0;
                    fruitScaleZ = crop.dvs > 0.95 ? 0.88 : 0;
                    foliagePitch += 0.12;
                } else if (crop.type === 'MAIZE') {
                    stemScaleY = (0.72 + (heightFactor * 0.8)) * vigor;
                    foliageScaleX = 1.08 + (vigor * 0.22);
                    foliageScaleY = 0.74 + (heightFactor * 0.72);
                    foliageScaleZ = 1.08;
                    fruitScaleX = crop.dvs > 0.98 ? 0.95 : 0;
                    fruitScaleY = crop.dvs > 0.98 ? 0.95 : 0;
                    fruitScaleZ = crop.dvs > 0.98 ? 0.95 : 0;
                    foliagePitch += 0.35;
                    fruitPitch -= 0.12;
                } else if (crop.type === 'COTTON') {
                    stemScaleX = 1.1;
                    stemScaleY = (0.52 + (stageFactor * 0.35)) * vigor;
                    stemScaleZ = 1.1;
                    foliageScaleX = 0.9 + (crop.lai * 0.08);
                    foliageScaleY = 0.82 + (crop.lai * 0.05);
                    foliageScaleZ = 0.9 + (crop.lai * 0.08);
                    fruitScaleX = crop.dvs > 1.0 ? 0.92 : 0;
                    fruitScaleY = crop.dvs > 1.0 ? 0.92 : 0;
                    fruitScaleZ = crop.dvs > 1.0 ? 0.92 : 0;
                    foliagePitch = windLean * 0.7;
                } else {
                    stemScaleX = 1.05;
                    stemScaleY = (0.58 + (stageFactor * 0.28)) * vigor;
                    stemScaleZ = 1.05;
                    foliageScaleX = 0.88 + (crop.lai * 0.06);
                    foliageScaleY = 0.96 + (crop.lai * 0.05);
                    foliageScaleZ = 0.82 + (crop.lai * 0.05);
                    fruitScaleX = crop.dvs > 1.0 ? 0.92 : 0;
                    fruitScaleY = crop.dvs > 1.0 ? 0.92 : 0;
                    fruitScaleZ = crop.dvs > 1.0 ? 0.92 : 0;
                    foliagePitch = windLean * 0.65;
                    fruitPitch -= 0.22;
                }

                dummy.position.set(xPos, 0, zPos);
                dummy.rotation.set(windLean - stressDrop, yaw, windLean * 0.75);
                dummy.scale.set(stemScaleX, stemScaleY, stemScaleZ);
                dummy.updateMatrix();
                if (stemRef.current) stemRef.current.setMatrixAt(idx, dummy.matrix);

                dummy.position.set(xPos, 0, zPos);
                dummy.rotation.set(foliagePitch - stressDrop, yaw + (phase * 0.1), windLean * 1.1);
                dummy.scale.set(foliageScaleX, foliageScaleY, foliageScaleZ);
                dummy.updateMatrix();
                if (foliageRef.current) foliageRef.current.setMatrixAt(idx, dummy.matrix);

                dummy.position.set(xPos, 0, zPos);
                dummy.rotation.set(fruitPitch - stressDrop, yaw, windLean * 0.85);
                dummy.scale.set(fruitScaleX, fruitScaleY, fruitScaleZ);
                dummy.updateMatrix();
                if (fruitRef.current) fruitRef.current.setMatrixAt(idx, dummy.matrix);

                idx++;
            }
        }

        if (stemRef.current) stemRef.current.instanceMatrix.needsUpdate = true;
        if (foliageRef.current) foliageRef.current.instanceMatrix.needsUpdate = true;
        if (fruitRef.current) fruitRef.current.instanceMatrix.needsUpdate = true;

        if (crop.type === 'WHEAT') {
            stemColor.set(crop.dvs > 1.08 ? '#9c7a43' : '#6d8b34');
            foliageColor.set(crop.dvs > 1.08 ? '#d1b85a' : '#8ccf57');
            fruitColor.set(crop.dvs > 1.08 ? '#f2dc8a' : '#c0df70');
        } else if (crop.type === 'MAIZE') {
            stemColor.set('#5f7f2b');
            foliageColor.set('#58a33f');
            fruitColor.set(crop.dvs > 1.0 ? '#f3cc59' : '#b4d86a');
        } else if (crop.type === 'COTTON') {
            stemColor.set('#64753c');
            foliageColor.set('#3f914a');
            fruitColor.set(crop.dvs > 1.0 ? '#f5f5f4' : '#f3c7dc');
        } else {
            stemColor.set('#64753c');
            foliageColor.set('#32964b');
            fruitColor.set(crop.dvs > 1.0 ? '#e03131' : '#9bd04c');
        }

        if (state.stress.water > 0.35) {
            stemColor.lerp(stressColor, 0.45);
            foliageColor.lerp(stressColor, 0.68);
            fruitColor.lerp(stressColor, 0.2);
        }

        if (stemRef.current && stemRef.current.material instanceof THREE.MeshStandardMaterial) {
            stemRef.current.material.color.copy(stemColor);
        }
        if (foliageRef.current && foliageRef.current.material instanceof THREE.MeshStandardMaterial) {
            foliageRef.current.material.color.copy(foliageColor);
        }
        if (fruitRef.current && fruitRef.current.material instanceof THREE.MeshStandardMaterial) {
            fruitRef.current.material.color.copy(fruitColor);
        }
    });

    const isRaining = state.weather.rain > 5;

    return (
        <group>
            <Sky
                sunPosition={[90, 25 + (Math.sin(state.day * 0.1) * 18), 70]}
                turbidity={isRaining ? 17 : 8}
                rayleigh={isRaining ? 0.7 : 2.2}
                mieCoefficient={0.02}
            />
            <Stars fade count={isMobile ? 1800 : 3200} saturation={0} factor={2} />
            <Cloud position={[0, 20, 0]} opacity={isRaining ? 0.88 : 0.22} speed={0.15} color={isRaining ? '#5a5a5a' : '#ffffff'} />
            <Cloud position={[-18, 26, -12]} opacity={isRaining ? 0.72 : 0.12} speed={0.09} color={isRaining ? '#4b5563' : '#f8fafc'} />
            <fogExp2 attach="fog" args={[isRaining ? '#151515' : '#213018', isRaining ? 0.038 : 0.016]} />

            <RainSystem count={isMobile ? 500 : 2200} active={isRaining} />

            <hemisphereLight args={['#dbeafe', '#2f241d', isRaining ? 0.35 : 0.9]} />
            <ambientLight intensity={isRaining ? 0.18 : 0.28} />
            <directionalLight
                position={[45, 50, 18]}
                intensity={isRaining ? 0.75 : 1.8}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[1000, 1000, 32, 32]} />
                <meshStandardMaterial color={isRaining ? groundWet : groundDry} roughness={0.95} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                <planeGeometry args={[GRID_SIZE * 1.25, GRID_SIZE * 1.25, 1, 1]} />
                <meshStandardMaterial color={isRaining ? '#3c5f2a' : '#6f5c2d'} roughness={1} opacity={0.15} transparent />
            </mesh>

            <instancedMesh ref={stemRef} args={[stemGeo, undefined, COUNT]} castShadow receiveShadow>
                <meshStandardMaterial roughness={0.72} />
            </instancedMesh>
            <instancedMesh ref={foliageRef} args={[foliageGeo, undefined, COUNT]} castShadow receiveShadow>
                <meshStandardMaterial side={THREE.DoubleSide} roughness={0.6} />
            </instancedMesh>
            <instancedMesh ref={fruitRef} args={[fruitGeo, undefined, COUNT]} castShadow receiveShadow>
                <meshStandardMaterial roughness={0.48} />
            </instancedMesh>
        </group>
    );
};

// --- SCout Mode (WASD Movement) ---
const ScoutCamera: React.FC = () => {
    const { camera } = useThree();
    const moveForward = useRef(false);
    const moveBackward = useRef(false);
    const moveLeft = useRef(false);
    const moveRight = useRef(false);
    const direction = useRef(new THREE.Vector3());

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': moveForward.current = true; break;
                case 'ArrowLeft': case 'KeyA': moveLeft.current = true; break;
                case 'ArrowDown': case 'KeyS': moveBackward.current = true; break;
                case 'ArrowRight': case 'KeyD': moveRight.current = true; break;
            }
        };
        const onKeyUp = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'ArrowUp': case 'KeyW': moveForward.current = false; break;
                case 'ArrowLeft': case 'KeyA': moveLeft.current = false; break;
                case 'ArrowDown': case 'KeyS': moveBackward.current = false; break;
                case 'ArrowRight': case 'KeyD': moveRight.current = false; break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    useFrame((_, delta) => {
        if (!moveForward.current && !moveBackward.current && !moveLeft.current && !moveRight.current) return;

        // Speed settings
        const speed = 10.0 * delta;

        direction.current.z = Number(moveForward.current) - Number(moveBackward.current);
        direction.current.x = Number(moveRight.current) - Number(moveLeft.current);
        direction.current.normalize(); // consistent speed in all directions

        if (moveForward.current || moveBackward.current) camera.translateZ(direction.current.z * speed);
        if (moveLeft.current || moveRight.current) camera.translateX(direction.current.x * speed);

        // Keep height fixed (Walk on ground)
        camera.position.y = 1.7;
    });

    // Touch Controls for Mobile
    const isMobile = useMobile();

    return (
        <>
            {!isMobile && <PointerLockControls />}
            {isMobile && (
                <div className="absolute bottom-20 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
                    <div className="flex justify-center">
                        <button
                            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full active:bg-white/40 flex items-center justify-center border border-white/10 touch-none"
                            onTouchStart={() => moveForward.current = true}
                            onTouchEnd={() => moveForward.current = false}
                        >
                            <ChevronRight className="w-6 h-6 -rotate-90 text-white" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full active:bg-white/40 flex items-center justify-center border border-white/10 touch-none"
                            onTouchStart={() => moveLeft.current = true}
                            onTouchEnd={() => moveLeft.current = false}
                        >
                            <ChevronRight className="w-6 h-6 rotate-180 text-white" />
                        </button>
                        <button
                            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full active:bg-white/40 flex items-center justify-center border border-white/10 touch-none"
                            onTouchStart={() => moveBackward.current = true}
                            onTouchEnd={() => moveBackward.current = false}
                        >
                            <ChevronRight className="w-6 h-6 rotate-90 text-white" />
                        </button>
                        <button
                            className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full active:bg-white/40 flex items-center justify-center border border-white/10 touch-none"
                            onTouchStart={() => moveRight.current = true}
                            onTouchEnd={() => moveRight.current = false}
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

const CameraController: React.FC<{ mode: 'ORBIT' | 'SCOUT' }> = ({ mode }) => {
    const { camera } = useThree();

    useEffect(() => {
        if (mode === 'SCOUT') {
            camera.position.set(0, 1.7, 5); // Start at edge
            camera.lookAt(0, 1.7, 0);
        } else {
            camera.position.set(20, 20, 20);
            camera.lookAt(0, 0, 0);
        }
    }, [mode, camera]);

    return mode === 'ORBIT' ?
        <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} /> :
        <ScoutCamera />;
};

export const Simulator: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Setup (Mock SHC for now - usually passed from user profile)
    const [shc] = useState<SoilHealthCard>({
        id: "demo-1", N: 280, P: 22, K: 150, pH: 7.2, EC: 0.5, OC: 0.6
    });

    const [engine, setEngine] = useState<AgriTwinEngine>(new AgriTwinEngine(shc, 'WHEAT'));
    const [simState, setSimState] = useState<SimulationState>(engine.state);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<CropType>('WHEAT');
    const [cameraMode, setCameraMode] = useState<'ORBIT' | 'SCOUT'>('ORBIT');
    // Mobile Sidebar State
    const isMobile = useMobile();
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

    useEffect(() => {
        setIsSidebarOpen(!isMobile);
    }, [isMobile]);

    // Auto-Run Effect
    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isPlaying) {
            interval = setInterval(() => {
                const newState = engine.nextDay({});
                setSimState(newState);
                if (newState.crop.dvs >= 2.0 || newState.crop.health <= 0) setIsPlaying(false);
            }, 500); // Slower day cycle for weather observation
        }
        return () => clearInterval(interval);
    }, [isPlaying, engine]);

    const handleAction = (type: 'IRRIGATE' | 'FERTILIZE' | 'WEED' | 'HARVEST') => {
        const newState = engine.nextDay(
            type === 'IRRIGATE' ? { irrigate: 20 } :
                type === 'FERTILIZE' ? { fertilize_n: 15 } :
                    type === 'WEED' ? { weed: true } :
                        { harvest: true, newCrop: selectedCrop }
        );

        if (type === 'HARVEST') {
            setIsPlaying(false);
        }

        setSimState(newState);
    };

    const reset = () => {
        const newEngine = new AgriTwinEngine(shc, selectedCrop);
        setEngine(newEngine);
        setSimState(newEngine.state);
        setIsPlaying(false);
    };

    return (
        <div className="h-[100dvh] bg-neutral-900 text-white overflow-hidden flex flex-col md:flex-row font-sans relative">
            {/* Mobile Header / Toggle */}
            <div className="md:hidden bg-neutral-800 border-b border-white/10 p-4 flex justify-between items-center z-20 shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/')} className="text-neutral-400 p-1 mr-1">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <AgriTwinMark className="w-6 h-6" aria-label="Agri-Twin" />
                    <span className="font-bold text-lg tracking-tight">Agri-Twin</span>
                </div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? 'bg-white/10 text-white' : 'text-neutral-400'}`}
                >
                    <Layers className="w-5 h-5" />
                </button>
            </div>

            {/* Sidebar / Configuration */}
            <div className={`
                absolute md:relative inset-0 z-30 md:z-auto bg-neutral-900/95 md:bg-neutral-800/50 backdrop-blur-xl md:backdrop-blur-none 
                border-r border-white/10 p-6 flex-col gap-6 transition-transform duration-300 ease-in-out md:translate-x-0 md:flex md:w-80
                ${isSidebarOpen ? 'flex translate-x-0' : 'hidden md:flex -translate-x-full'}
            `}>
                <div className="hidden md:block mb-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors mb-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>{t('back_to_hub', 'Back to Hub')}</span>
                    </button>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                        <AgriTwinMark className="w-7 h-7 shrink-0" aria-label="Agri-Twin" /> {t('sim_title', 'Agri-Twin')}
                    </h1>
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Cyber-Physical Simulator</p>
                </div>

                {/* Mobile Close Button */}
                <button
                    className="md:hidden absolute top-4 right-4 p-2 text-neutral-400"
                    onClick={() => setIsSidebarOpen(false)}
                >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                </button>

                {/* Crop Selector */}
                <div className="space-y-2 mt-8 md:mt-0">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Crop Model</label>
                    <div className="grid grid-cols-2 gap-2">
                        {AGRITWIN_VISIBLE_CROPS.map(c => (
                            <button
                                key={c}
                                onClick={() => { setSelectedCrop(c); const e = new AgriTwinEngine(shc, c); setEngine(e); setSimState(e.state); if (isMobile) setIsSidebarOpen(false); }}
                                className={`p-2 rounded-lg text-xs font-bold transition-all border ${selectedCrop === c
                                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                    : 'bg-neutral-800 border-white/5 text-neutral-400 hover:bg-white/5'}`}
                            >
                                {CROP_LIBRARY[c].name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Soil Health Stats */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-xs text-neutral-400 uppercase font-bold">
                        <span>Soil Health</span>
                        <Layers className="w-4 h-4" />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-black/20 p-2 rounded">
                            <div className="text-xs text-neutral-500">N</div>
                            <div className="font-mono text-emerald-400">{Math.floor(simState.soil.n_pool)}</div>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                            <div className="text-xs text-neutral-500">P</div>
                            <div className="font-mono text-cyan-400">{shc.P}</div>
                        </div>
                        <div className="bg-black/20 p-2 rounded">
                            <div className="text-xs text-neutral-500">K</div>
                            <div className="font-mono text-purple-400">{shc.K}</div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleAction('IRRIGATE')} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Droplets className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('sim_irrigate', 'Irrigate')}</span>
                        </button>
                        <button onClick={() => handleAction('FERTILIZE')} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Sprout className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('sim_fertilize', 'Fertilize')}</span>
                        </button>
                        <button onClick={() => handleAction('WEED')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                            <Wind className="w-5 h-5" />
                            <span className="font-bold text-sm">De-Weed</span>
                        </button>
                        <button onClick={() => handleAction('HARVEST')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95">
                            <ChevronRight className="w-5 h-5" />
                            <span className="font-bold text-sm">Harvest &amp; Replant</span>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-black transition-all active:scale-95 ${isPlaying ? 'bg-amber-400 hover:bg-amber-500' : 'bg-emerald-400 hover:bg-emerald-500'}`}
                        >
                            {isPlaying ? <Pause className="fill-current w-4 h-4" /> : <Play className="fill-current w-4 h-4" />}
                            {isPlaying ? "Pause" : "Start"}
                        </button>
                        <button onClick={reset} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Camera Modes */}
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => { setCameraMode('ORBIT'); if (isMobile) setIsSidebarOpen(false); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold ${cameraMode === 'ORBIT' ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'}`}
                        >
                            GOD VIEW
                        </button>
                        <button
                            onClick={() => { setCameraMode('SCOUT'); if (isMobile) setIsSidebarOpen(false); }}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold ${cameraMode === 'SCOUT' ? 'bg-white text-black' : 'bg-white/5 text-neutral-400'}`}
                        >
                            SCOUT VIEW
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Stage (3D) */}
            <div className="flex-1 relative bg-black h-full">
                {/* HUD Overlay */}
                <div className="absolute top-4 md:top-6 left-4 right-4 md:left-6 md:right-6 flex flex-col md:flex-row justify-between items-start pointer-events-none z-10 gap-3">
                    <div className="flex gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                        <div className="bg-black/40 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/10 text-white min-w-[100px] md:min-w-0">
                            <div className="text-[10px] md:text-xs text-neutral-400 uppercase font-bold">Crop Age</div>
                            <div className="text-2xl md:text-3xl font-black font-mono">{simState.day} <span className="text-xs md:text-sm text-neutral-500 font-sans">{t('sim_days', 'Days')}</span></div>
                            <div className="text-[10px] md:text-xs text-emerald-400 mt-1 truncate">Stage: {simState.crop.dvs < 0.2 ? 'Seedling' : (simState.crop.dvs < 1 ? 'Vegetative' : 'Reproductive')}</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/10 text-white min-w-[120px] md:min-w-0">
                            <div className="text-[10px] md:text-xs text-neutral-400 uppercase font-bold">Yield Forecast</div>
                            <div className="text-2xl md:text-3xl font-black font-mono text-cyan-400">{Math.floor(simState.yield_forecast)} <span className="text-xs md:text-sm text-neutral-500 font-sans">kg/ha</span></div>
                        </div>
                        {simState.crop.weed_density > 0.1 && (
                            <div className="bg-red-900/40 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-red-500/30 text-white animate-pulse min-w-[120px] md:min-w-0">
                                <div className="text-[10px] md:text-xs text-red-300 uppercase font-bold">Weed Infestation</div>
                                <div className="text-xl md:text-2xl font-black font-mono text-red-400">{Math.floor(simState.crop.weed_density * 100)}%</div>
                                <div className="text-[10px] md:text-xs text-red-300 mt-1">Competition High</div>
                            </div>
                        )}
                    </div>

                    <div className="bg-black/40 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/10 text-white w-full md:w-auto md:min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2 text-[10px] md:text-xs text-neutral-400 uppercase font-bold">
                            <ThermometerSun className="w-4 h-4" /> Environment
                        </div>
                        <div className="flex md:block gap-4 md:gap-0 font-mono text-sm">
                            <div className="flex justify-between flex-1 md:flex-none">
                                <span className="text-neutral-500 md:text-white">Temp</span>
                                <span>{Math.floor(simState.weather.temp_max)}°C</span>
                            </div>
                            <div className="flex justify-between flex-1 md:flex-none">
                                <span className="text-neutral-500 md:text-white">Humidity</span>
                                <span>{simState.weather.rain > 0 ? '90%' : '45%'}</span>
                            </div>
                            <div className="flex justify-between flex-1 md:flex-none">
                                <span className="text-neutral-500 md:text-white">Rain</span>
                                <span>{Math.floor(simState.weather.rain)}mm</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controls Hint - Only show in Scout mode */}
                {cameraMode === 'SCOUT' && (
                    <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-xs mt-2 text-center pointer-events-none z-10 border border-white/10">
                        {isMobile ?
                            <b>Use On-Screen Controls to Move</b> :
                            <b>Click to Focus &bull; WASD to Move &bull; ESC to Exit</b>
                        }
                    </div>
                )}


                {/* 3D Canvas */}
                <div className="w-full h-full">
                    <Canvas shadows camera={{ position: [20, 20, 20], fov: 50 }}>
                        <CameraController mode={cameraMode} />
                        <Environment preset="forest" background blur={0.6} />
                        <FieldInstanceRenderer state={simState} isMobile={isMobile} />
                        <EffectComposer>
                            <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
                            <Vignette eskil={false} offset={0.1} darkness={1.1} />
                            <TiltShift2 blur={0.2} />
                            <Noise opacity={0.02} />
                        </EffectComposer>
                    </Canvas>
                </div>

                {/* Log Overlay - Bottom padding for mobile nav */}
                <div className="absolute bottom-24 md:bottom-6 left-4 right-4 md:left-6 md:right-6 pointer-events-none">
                    <div className="max-w-xl bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-3 md:p-4 text-xs font-mono max-h-24 md:max-h-32 overflow-hidden text-neutral-300">
                        {simState.event_log.slice(0, 3).map((log, i) => (
                            <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0 truncate">
                                <span className="text-emerald-500 mr-2">➜</span> {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div >
        </div >
    );
};
