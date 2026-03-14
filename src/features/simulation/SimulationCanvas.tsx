import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sky, ContactShadows } from '@react-three/drei';
import { CropType, SimulationState } from './SimulationEngine';
import * as THREE from 'three';

interface SimulationCanvasProps {
    state: SimulationState;
}

type BushType = Extract<CropType, 'COTTON' | 'TOMATO' | 'MUSTARD' | 'POTATO' | 'SOYBEAN'>;
type StalkType = Extract<CropType, 'MAIZE' | 'SUGARCANE'>;

const CEREAL_OFFSETS: Array<[number, number, number, number]> = [
    [-0.8, -0.55, 0.88, -0.08],
    [-0.28, -0.22, 1.0, 0.03],
    [0.26, -0.48, 0.95, 0.05],
    [0.66, -0.14, 0.86, -0.02],
    [-0.64, 0.26, 0.9, 0.04],
    [-0.08, 0.08, 1.08, 0.0],
    [0.48, 0.28, 0.94, -0.03],
    [-0.34, 0.64, 0.82, 0.09],
    [0.62, 0.62, 0.86, -0.04]
];

const ROW_CROP_OFFSETS: Array<[number, number, number, number]> = [
    [-0.8, -0.45, 0.9, -0.08],
    [-0.15, -0.1, 1.04, 0.0],
    [0.62, -0.38, 0.96, 0.06],
    [-0.48, 0.55, 0.86, -0.03],
    [0.36, 0.45, 0.92, 0.08]
];

const BUSH_OFFSETS: Array<[number, number, number, number]> = [
    [-0.75, -0.35, 0.9, -0.06],
    [-0.18, -0.08, 1.05, 0.02],
    [0.52, -0.28, 0.96, 0.09],
    [-0.36, 0.52, 0.88, -0.04],
    [0.4, 0.46, 0.92, 0.05]
];

const createCurvedLeafGeometry = (width: number, height: number, bend: number, lift: number) => {
    const geometry = new THREE.PlaneGeometry(width, height, 1, 6);
    const positions = geometry.attributes.position;

    for (let index = 0; index < positions.count; index++) {
        const normalizedHeight = (positions.getY(index) + (height / 2)) / height;
        positions.setX(index, positions.getX(index) + Math.sin(normalizedHeight * Math.PI) * bend);
        positions.setZ(index, positions.getZ(index) + normalizedHeight * normalizedHeight * lift);
    }

    geometry.translate(width * 0.18, height * 0.5, 0);
    geometry.computeVertexNormals();
    return geometry;
};

const LeafBlade: React.FC<{
    position: [number, number, number];
    rotation: [number, number, number];
    color: string;
    width?: number;
    height?: number;
    bend?: number;
    lift?: number;
}> = ({
    position,
    rotation,
    color,
    width = 0.14,
    height = 0.7,
    bend = 0.12,
    lift = 0.1
}) => {
    const geometry = useMemo(
        () => createCurvedLeafGeometry(width, height, bend, lift),
        [bend, height, lift, width]
    );

    return (
        <mesh geometry={geometry} position={position} rotation={rotation}>
            <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.62} />
        </mesh>
    );
};

const SoilMound: React.FC = () => (
    <group position={[0, 0.05, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.12, 0.28, 20]} />
            <meshStandardMaterial color="#5b3b22" transparent opacity={0.55} />
        </mesh>
        <mesh>
            <sphereGeometry args={[0.14, 16, 10]} />
            <meshStandardMaterial color="#6b4423" roughness={0.95} />
        </mesh>
    </group>
);

const WheatPlant: React.FC<{ stage: SimulationState['stage']; vigor: number }> = ({ stage, vigor }) => {
    const isMature = stage === 'FLOWERING' || stage === 'HARVEST';
    const stemColor = stage === 'HARVEST' ? '#b98b45' : '#6b8f34';
    const leafColor = stage === 'HARVEST' ? '#dbc46e' : '#8bcf58';
    const earColor = stage === 'HARVEST' ? '#f3d98a' : '#b6d76a';
    const stalkOffsets = [-0.1, -0.03, 0.05, 0.12];

    return (
        <group scale={[vigor, vigor, vigor]}>
            {stalkOffsets.map((offset, index) => (
                <group key={index} position={[offset, 0, (index - 1.5) * 0.05]} rotation={[0, offset * 1.6, 0]}>
                    <mesh position={[0, 0.55, 0]}>
                        <cylinderGeometry args={[0.012, 0.02, 1.1, 6]} />
                        <meshStandardMaterial color={stemColor} roughness={0.7} />
                    </mesh>
                    <LeafBlade position={[0, 0.2, 0]} rotation={[0.22, -0.4, -0.55]} color={leafColor} />
                    <LeafBlade position={[0, 0.45, 0]} rotation={[0.14, 0.6, 0.45]} color={leafColor} width={0.12} height={0.58} bend={0.08} lift={0.08} />
                    {isMature && (
                        <group position={[0.02, 1.08, 0]} rotation={[0.08, 0, 0.14]}>
                            <mesh>
                                <capsuleGeometry args={[0.045, 0.22, 5, 10]} />
                                <meshStandardMaterial color={earColor} roughness={0.55} />
                            </mesh>
                            {[-0.04, 0, 0.04].map((awnOffset) => (
                                <mesh key={awnOffset} position={[awnOffset, 0.16, 0]} rotation={[0.4, 0, awnOffset * 4]}>
                                    <cylinderGeometry args={[0.004, 0.004, 0.18, 5]} />
                                    <meshStandardMaterial color="#f7e4a3" />
                                </mesh>
                            ))}
                        </group>
                    )}
                </group>
            ))}
        </group>
    );
};

const RicePlant: React.FC<{ stage: SimulationState['stage']; vigor: number }> = ({ stage, vigor }) => {
    const isMature = stage === 'FLOWERING' || stage === 'HARVEST';
    const stemColor = '#6f9c47';
    const leafColor = stage === 'HARVEST' ? '#d2c56f' : '#73b94f';
    const grainColor = stage === 'HARVEST' ? '#f0d48d' : '#d9e786';
    const stalkOffsets = [-0.14, -0.06, 0.02, 0.09, 0.16];

    return (
        <group scale={[vigor, vigor, vigor]}>
            {stalkOffsets.map((offset, index) => (
                <group key={index} position={[offset, 0, (index - 2) * 0.05]} rotation={[0, offset * 2.2, 0]}>
                    <mesh position={[0, 0.58, 0]}>
                        <cylinderGeometry args={[0.008, 0.014, 1.15, 6]} />
                        <meshStandardMaterial color={stemColor} roughness={0.75} />
                    </mesh>
                    <LeafBlade position={[0, 0.26, 0]} rotation={[0.32, -0.55, -0.75]} color={leafColor} width={0.09} height={0.8} bend={0.16} lift={0.18} />
                    <LeafBlade position={[0, 0.42, 0]} rotation={[0.28, 0.68, 0.78]} color={leafColor} width={0.08} height={0.72} bend={0.18} lift={0.2} />
                    {isMature && (
                        <group position={[0.03, 0.98, 0]} rotation={[0.18, 0, 0.78]}>
                            <mesh>
                                <cylinderGeometry args={[0.01, 0.018, 0.32, 5]} />
                                <meshStandardMaterial color={grainColor} roughness={0.55} />
                            </mesh>
                            {[0.02, 0.08, 0.14, 0.2].map((grainY, grainIndex) => (
                                <mesh key={grainIndex} position={[0.05 + (grainIndex * 0.015), grainY, 0]}>
                                    <sphereGeometry args={[0.022, 8, 8]} />
                                    <meshStandardMaterial color={grainColor} roughness={0.5} />
                                </mesh>
                            ))}
                        </group>
                    )}
                </group>
            ))}
        </group>
    );
};

const StalkPlant: React.FC<{ type: StalkType; stage: SimulationState['stage']; vigor: number }> = ({ type, stage, vigor }) => {
    const isMature = stage === 'FLOWERING' || stage === 'HARVEST';
    const stemColor = type === 'SUGARCANE' ? '#88a34a' : '#6f8d2e';
    const leafColor = type === 'SUGARCANE' ? '#56a85a' : '#6dc35a';

    return (
        <group scale={[vigor, vigor, vigor]}>
            <mesh position={[0, 1.15, 0]}>
                <cylinderGeometry args={[0.07, 0.1, 2.3, 8]} />
                <meshStandardMaterial color={stemColor} roughness={0.7} />
            </mesh>

            {type === 'SUGARCANE' && [0.45, 0.95, 1.45, 1.95].map((jointHeight) => (
                <mesh key={jointHeight} position={[0, jointHeight, 0]}>
                    <torusGeometry args={[0.09, 0.01, 8, 18]} />
                    <meshStandardMaterial color="#d7e8a2" roughness={0.5} />
                </mesh>
            ))}

            <LeafBlade position={[0.05, 0.55, 0]} rotation={[0.5, -0.8, -0.7]} color={leafColor} width={0.16} height={1.25} bend={0.28} lift={0.24} />
            <LeafBlade position={[-0.05, 0.95, 0]} rotation={[0.3, 0.9, 0.62]} color={leafColor} width={0.16} height={1.05} bend={0.22} lift={0.18} />
            <LeafBlade position={[0.06, 1.28, 0]} rotation={[0.2, -0.3, -0.45]} color={leafColor} width={0.14} height={0.95} bend={0.16} lift={0.14} />

            {isMature && type === 'MAIZE' && (
                <group position={[0.18, 1.18, 0.02]} rotation={[0.04, 0, -0.32]}>
                    <mesh>
                        <capsuleGeometry args={[0.11, 0.42, 6, 12]} />
                        <meshStandardMaterial color={stage === 'HARVEST' ? '#f3c74e' : '#dfe57b'} roughness={0.45} />
                    </mesh>
                    <LeafBlade position={[-0.02, 0.1, 0]} rotation={[0.2, 0.3, 0.45]} color="#86b650" width={0.1} height={0.5} bend={0.06} lift={0.06} />
                </group>
            )}

            {isMature && type === 'SUGARCANE' && (
                <mesh position={[0, 2.45, 0]}>
                    <coneGeometry args={[0.06, 0.55, 8]} />
                    <meshStandardMaterial color="#ddd6fe" roughness={0.55} />
                </mesh>
            )}
        </group>
    );
};

const BushPlant: React.FC<{ type: BushType; stage: SimulationState['stage']; vigor: number }> = ({ type, stage, vigor }) => {
    const isMature = stage === 'FLOWERING' || stage === 'HARVEST';
    const leafColor = type === 'MUSTARD' ? '#6fba48' : '#2f9149';
    const stemColor = '#6a4b31';
    const branchRotations = [-0.7, 0, 0.7];

    const renderFruit = (index: number, position: [number, number, number]) => {
        if (!isMature) return null;

        if (type === 'COTTON') {
            return (
                <mesh key={index} position={position}>
                    <sphereGeometry args={[0.12, 12, 12]} />
                    <meshStandardMaterial color={stage === 'HARVEST' ? '#f8fafc' : '#f7cadb'} roughness={0.45} />
                </mesh>
            );
        }

        if (type === 'TOMATO') {
            return (
                <mesh key={index} position={position}>
                    <sphereGeometry args={[0.11, 14, 14]} />
                    <meshStandardMaterial color={stage === 'HARVEST' ? '#ef4444' : '#fde68a'} roughness={0.42} />
                </mesh>
            );
        }

        if (type === 'MUSTARD') {
            return (
                <mesh key={index} position={position}>
                    <sphereGeometry args={[0.08, 10, 10]} />
                    <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.32} />
                </mesh>
            );
        }

        if (type === 'POTATO') {
            return (
                <mesh key={index} position={[position[0] * 0.6, 0.12, position[2] * 0.6]}>
                    <sphereGeometry args={[0.08, 10, 10]} />
                    <meshStandardMaterial color="#8b5a2b" roughness={0.9} />
                </mesh>
            );
        }

        return (
            <mesh key={index} position={position} rotation={[0.15, 0, 0.4]}>
                <capsuleGeometry args={[0.05, 0.18, 5, 10]} />
                <meshStandardMaterial color={stage === 'HARVEST' ? '#a16207' : '#84cc16'} roughness={0.52} />
            </mesh>
        );
    };

    return (
        <group scale={[vigor, vigor, vigor]}>
            <mesh position={[0, 0.42, 0]}>
                <cylinderGeometry args={[0.035, 0.05, 0.84, 7]} />
                <meshStandardMaterial color={stemColor} roughness={0.75} />
            </mesh>

            {branchRotations.map((rotation, index) => (
                <mesh key={index} position={[0, 0.8, 0]} rotation={[0.55, rotation, rotation * 0.45]}>
                    <cylinderGeometry args={[0.018, 0.024, 0.6, 6]} />
                    <meshStandardMaterial color={stemColor} roughness={0.72} />
                </mesh>
            ))}

            <mesh position={[0, 0.95, 0]}>
                <dodecahedronGeometry args={[0.52]} />
                <meshStandardMaterial color={leafColor} roughness={0.62} />
            </mesh>
            <LeafBlade position={[0.16, 0.72, 0]} rotation={[0.3, 0.2, 0.65]} color={leafColor} width={0.14} height={0.46} bend={0.08} lift={0.06} />
            <LeafBlade position={[-0.18, 0.8, 0]} rotation={[0.22, -0.3, -0.72]} color={leafColor} width={0.14} height={0.5} bend={0.08} lift={0.06} />

            {[
                [0.24, 0.92, 0.12],
                [-0.22, 1.06, -0.08],
                [0.04, 1.18, 0.22],
                [-0.1, 0.88, 0.24]
            ].map((position, index) => renderFruit(index, position as [number, number, number]))}
        </group>
    );
};

const PlantSpecimen: React.FC<{ state: SimulationState }> = ({ state }) => {
    const group = useRef<THREE.Group>(null);
    const { stage, cropType, health } = state;
    const growthProgress = Math.min(1, Math.max(0.08, state.day / 60));
    const growthScale = 0.18 + (growthProgress * 0.95);
    const vigor = Math.max(0.72, health / 100);

    useFrame((renderState) => {
        if (group.current) {
            group.current.rotation.z = Math.sin(renderState.clock.elapsedTime * 1.2) * 0.035;
        }
    });

    if (stage === 'SEED') return <SoilMound />;
    if (stage === 'DEAD') return null;

    return (
        <group ref={group} scale={[growthScale, growthScale, growthScale]}>
            {cropType === 'WHEAT' && <WheatPlant stage={stage} vigor={vigor} />}
            {cropType === 'RICE' && <RicePlant stage={stage} vigor={vigor} />}
            {(cropType === 'MAIZE' || cropType === 'SUGARCANE') && <StalkPlant type={cropType} stage={stage} vigor={vigor} />}
            {(['COTTON', 'TOMATO', 'MUSTARD', 'POTATO', 'SOYBEAN'] as BushType[]).includes(cropType as BushType) && (
                <BushPlant type={cropType as BushType} stage={stage} vigor={vigor} />
            )}
        </group>
    );
};

const CropStand: React.FC<{ state: SimulationState }> = ({ state }) => {
    const offsets = state.cropType === 'WHEAT' || state.cropType === 'RICE'
        ? CEREAL_OFFSETS
        : (state.cropType === 'MAIZE' || state.cropType === 'SUGARCANE')
            ? ROW_CROP_OFFSETS
            : BUSH_OFFSETS;

    return (
        <group>
            {offsets.map(([x, z, scale, yaw], index) => (
                <group key={index} position={[x, 0, z]} rotation={[0, yaw, 0]} scale={[scale, scale, scale]}>
                    <PlantSpecimen state={state} />
                </group>
            ))}
        </group>
    );
};

export const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ state }) => {
    const skySunPosition = state.weather === 'STORM'
        ? [0, 3, -4]
        : state.weather === 'RAIN'
            ? [3, 5, 2]
            : [8, 10, 5];

    const groundColor = state.waterLevel < 20
        ? '#9b7b4f'
        : state.weather === 'RAIN'
            ? '#5a4a35'
            : '#6e5538';

    return (
        <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner bg-gradient-to-b from-sky-200 to-emerald-100 relative">
            <div className="absolute top-4 left-4 z-10 bg-white/85 backdrop-blur rounded-lg p-3 text-xs font-mono shadow-sm">
                <div>Day: {state.day}</div>
                <div>Stage: {state.stage}</div>
                <div>Weather: {state.weather}</div>
            </div>

            <Canvas shadows camera={{ position: [4.4, 2.9, 4.8], fov: 52 }}>
                <ambientLight intensity={0.55} />
                <hemisphereLight args={['#dbeafe', '#3f2f1f', 0.68]} />
                <directionalLight position={[5, 10, 5]} intensity={1.45} castShadow />
                <Sky sunPosition={skySunPosition as [number, number, number]} turbidity={state.weather === 'STORM' ? 10 : 3} />

                {state.weather === 'RAIN' && (
                    <mesh position={[0, 4.6, 0]}>
                        <cylinderGeometry args={[4.4, 4.4, 8.2, 18, 1, true]} />
                        <meshStandardMaterial color="#93c5fd" transparent opacity={0.12} wireframe />
                    </mesh>
                )}

                <group position={[0, -1, 0]}>
                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[20, 20]} />
                        <meshStandardMaterial color={groundColor} roughness={0.96} />
                    </mesh>

                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
                        <ringGeometry args={[0.8, 2.8, 32]} />
                        <meshStandardMaterial color="#3f6f36" transparent opacity={0.12} />
                    </mesh>

                    <CropStand state={state} />
                    <ContactShadows resolution={512} scale={11} blur={2.4} opacity={0.48} far={10} color="#000000" />
                </group>

                <OrbitControls enableZoom maxPolarAngle={Math.PI / 2.05} minDistance={3} maxDistance={7} />
            </Canvas>
        </div>
    );
};
