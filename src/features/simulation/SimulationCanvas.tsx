import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, ContactShadows } from '@react-three/drei';
import { SimulationState } from './SimulationEngine';
import * as THREE from 'three';

interface SimulationCanvasProps {
    state: SimulationState;
}

const Plant: React.FC<{ stage: string; health: number }> = ({ stage, health }) => {
    // Procedural Plant Generation (Simplified Geometry)
    const group = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (group.current) {
            // Gentle sway animation
            group.current.rotation.z = Math.sin(state.clock.elapsedTime) * 0.05;
        }
    });

    const getPlantGeometry = () => {
        const healthColor = new THREE.Color().setHSL(0.3 * (health / 100), 0.8, 0.4);

        if (stage === 'SEED') {
            return (
                <mesh position={[0, 0.1, 0]}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshStandardMaterial color="#8B4513" />
                </mesh>
            );
        }
        if (stage === 'SEEDLING') {
            return (
                <group>
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 1]} />
                        <meshStandardMaterial color={healthColor} />
                    </mesh>
                    <mesh position={[0.2, 0.8, 0]} rotation={[0, 0, -0.5]}>
                        <sphereGeometry args={[0.15, 32, 16]} />
                        <meshStandardMaterial color={healthColor} />
                    </mesh>
                </group>
            );
        }
        if (stage === 'VEGETATIVE') {
            return (
                <group>
                    <mesh position={[0, 1, 0]}>
                        <cylinderGeometry args={[0.1, 0.15, 2]} />
                        <meshStandardMaterial color={healthColor} />
                    </mesh>
                    {[...Array(5)].map((_, i) => (
                        <mesh key={i} position={[Math.sin(i) * 0.5, 1 + i * 0.4, Math.cos(i) * 0.5]}>
                            <sphereGeometry args={[0.4, 32, 16]} />
                            <meshStandardMaterial color={healthColor} />
                        </mesh>
                    ))}
                </group>
            );
        }
        if (stage === 'FLOWERING' || stage === 'HARVEST') {
            return (
                <group>
                    <mesh position={[0, 1.5, 0]}>
                        <cylinderGeometry args={[0.15, 0.2, 3]} />
                        <meshStandardMaterial color={healthColor} />
                    </mesh>
                    {/* Leaves */}
                    {[...Array(8)].map((_, i) => (
                        <mesh key={i} position={[Math.sin(i) * 0.8, 1 + i * 0.3, Math.cos(i) * 0.8]}>
                            <sphereGeometry args={[0.5, 32, 16]} />
                            <meshStandardMaterial color={healthColor} />
                        </mesh>
                    ))}
                    {/* Flowers/Fruit */}
                    <mesh position={[0, 3.2, 0]}>
                        <dodecahedronGeometry args={[0.6]} />
                        <meshStandardMaterial color={stage === 'HARVEST' ? "gold" : "yellow"} emissive={stage === 'HARVEST' ? "orange" : "black"} />
                    </mesh>
                </group>
            );
        }
        if (stage === 'DEAD') {
            return (
                <mesh position={[0, 0.5, 0]} rotation={[0, 0, 1.5]}>
                    <cylinderGeometry args={[0.1, 0.1, 2]} />
                    <meshStandardMaterial color="#5c4033" />
                </mesh>
            );
        }
        return null;
    };

    return <group ref={group}>{getPlantGeometry()}</group>;
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ state }) => {
    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner bg-gradient-to-b from-sky-200 to-emerald-100 relative">
            {/* State Overlays */}
            <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur rounded-lg p-3 text-xs font-mono shadow-sm">
                <div>Day: {state.day}</div>
                <div>Stage: {state.stage}</div>
                <div>Weather: {state.weather}</div>
            </div>

            <Canvas shadows camera={{ position: [4, 4, 4], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[5, 10, 5]}
                    intensity={state.weather === 'SUNNY' ? 1.5 : 0.5}
                    castShadow
                />
                <Sky sunPosition={state.weather === 'SUNNY' ? [10, 10, 10] : [0, 1, 0]} turbidity={state.weather === 'STORM' ? 10 : 0} />

                {/* Rain Effect */}
                {state.weather === 'RAIN' || state.weather === 'STORM' ? (
                    <mesh position={[0, 5, 0]}>
                        <cylinderGeometry args={[5, 5, 10, 8]} />
                        <meshStandardMaterial color="#88aaff" transparent opacity={0.2} wireframe />
                    </mesh>
                ) : null}

                <group position={[0, -1, 0]}>
                    {/* Ground */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[20, 20]} />
                        <meshStandardMaterial
                            color={state.waterLevel < 20 ? "#d2b48c" : "#5d4037"} // Dry vs Wet Soil
                        />
                    </mesh>

                    {/* The Crop */}
                    <Plant stage={state.stage} health={state.health} />

                    <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
                </group>

                <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
};
