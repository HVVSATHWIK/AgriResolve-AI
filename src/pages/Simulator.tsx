import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, RefreshCw, Droplets, Sprout, Wind, ThermometerSun, Activity, ChevronRight, Layers } from 'lucide-react';
import { AgriTwinEngine } from '../features/agritwin/engine';
import { SoilHealthCard, SimulationState, CROP_LIBRARY, CropType } from '../features/agritwin/types';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, ContactShadows } from '@react-three/drei';

// --- 3D Components (Visuals) ---
const Field3D: React.FC<{ state: SimulationState }> = ({ state }) => {
    // Generate plants based on LAI/Density
    const plantCount = Math.min(50, Math.floor(state.crop.lai * 10)); // simple visual scaling

    return (
        <group>
            <Sky sunPosition={[100, 20, 100]} />
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} shadow-mapSize={[2048, 2048]} castShadow />

            {/* Ground */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#5d4037" roughness={1} />
            </mesh>

            {/* Crops (Instanced would be better for perf, but simple map for now) */}
            {Array.from({ length: plantCount }).map((_, i) => {
                const x = (i % 7) * 0.8 - 2.5;
                const z = Math.floor(i / 7) * 0.8 - 2.5;
                const height = state.crop.height / 20; // Scale down for visual
                const color = state.stress.nitrogen > 0.3 ? "#d4e157" : (state.stress.water > 0.3 ? "#8d6e63" : "#4caf50");

                return (
                    <mesh key={i} position={[x, height / 2, z]} castShadow>
                        <boxGeometry args={[0.2, height, 0.2]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                );
            })}

            <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />
        </group>
    );
};

// --- Main Interface ---
export const Simulator: React.FC = () => {
    const { t } = useTranslation();
    // Setup (Mock SHC for now - usually passed from user profile)
    const [shc] = useState<SoilHealthCard>({
        id: "demo-1", N: 280, P: 22, K: 150, pH: 7.2, EC: 0.5, OC: 0.6
    });

    const [engine, setEngine] = useState<AgriTwinEngine>(new AgriTwinEngine(shc, 'RICE'));
    const [simState, setSimState] = useState<SimulationState>(engine.state);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedCrop, setSelectedCrop] = useState<CropType>('RICE');

    // Auto-Run Effect
    useEffect(() => {
        let interval: any;
        if (isPlaying) {
            interval = setInterval(() => {
                const newState = engine.nextDay({});
                setSimState(newState);
                if (newState.crop.dvs >= 2.0 || newState.crop.health <= 0) setIsPlaying(false);
            }, 500); // 500ms per day
        }
        return () => clearInterval(interval);
    }, [isPlaying, engine]);

    const handleAction = (type: 'IRRIGATE' | 'FERTILIZE') => {
        const newState = engine.nextDay(
            type === 'IRRIGATE' ? { irrigate: 20 } : { fertilize_n: 15 }
        );
        setSimState(newState);
    };

    const reset = () => {
        const newEngine = new AgriTwinEngine(shc, selectedCrop);
        setEngine(newEngine);
        setSimState(newEngine.state);
        setIsPlaying(false);
    };

    return (
        <div className="h-screen bg-neutral-900 text-white overflow-hidden flex flex-col md:flex-row font-sans">
            {/* Sidebar / Configuration */}
            <div className="w-full md:w-80 bg-neutral-800/50 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col gap-6 z-10">
                <div>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-400" /> {t('sim_title', 'Agri-Twin')}
                    </h1>
                    <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest">Cyber-Physical Simulator</p>
                </div>

                {/* Crop Selector */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-500 uppercase">Crop Model</label>
                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(CROP_LIBRARY) as CropType[]).map(c => (
                            <button
                                key={c}
                                onClick={() => { setSelectedCrop(c); const e = new AgriTwinEngine(shc, c); setEngine(e); setSimState(e.state); }}
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
                        <button onClick={() => handleAction('IRRIGATE')} className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                            <Droplets className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('sim_irrigate', 'Irrigate')}</span>
                        </button>
                        <button onClick={() => handleAction('FERTILIZE')} className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 p-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                            <Sprout className="w-5 h-5" />
                            <span className="font-bold text-sm">{t('sim_fertilize', 'Fertilize')}</span>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-black transition-all ${isPlaying ? 'bg-amber-400 hover:bg-amber-500' : 'bg-emerald-400 hover:bg-emerald-500'}`}
                        >
                            {isPlaying ? <Pause className="fill-current w-4 h-4" /> : <Play className="fill-current w-4 h-4" />}
                            {isPlaying ? "Pause" : "Start Simulation"}
                        </button>
                        <button onClick={reset} className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Stage (3D) */}
            <div className="flex-1 relative bg-black">
                {/* HUD Overlay */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none z-10">
                    <div className="flex gap-4">
                        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white">
                            <div className="text-xs text-neutral-400 uppercase font-bold">Crop Age</div>
                            <div className="text-3xl font-black font-mono">{simState.day} <span className="text-sm text-neutral-500 font-sans">{t('sim_days', 'Days')}</span></div>
                            <div className="text-xs text-emerald-400 mt-1">Stage: {simState.crop.dvs < 0.2 ? 'Seedling' : (simState.crop.dvs < 1 ? 'Vegetative' : 'Reproductive')}</div>
                        </div>
                        <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white">
                            <div className="text-xs text-neutral-400 uppercase font-bold">Yield Forecast</div>
                            <div className="text-3xl font-black font-mono text-cyan-400">{Math.floor(simState.yield_forecast)} <span className="text-sm text-neutral-500 font-sans">kg/ha</span></div>
                        </div>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-white min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400 uppercase font-bold">
                            <ThermometerSun className="w-4 h-4" /> Environment
                        </div>
                        <div className="space-y-1 font-mono text-sm">
                            <div className="flex justify-between">
                                <span>Temp</span>
                                <span>{Math.floor(simState.weather.temp_max)}°C</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Humidity</span>
                                <span>{simState.weather.rain > 0 ? '90%' : '45%'}</span>
                            </div>
                            <div className="flex justify-between text-blue-400">
                                <span>Rain</span>
                                <span>{Math.floor(simState.weather.rain)}mm</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3D Canvas */}
                <div className="w-full h-full">
                    <Canvas shadows camera={{ position: [5, 5, 5], fov: 50 }}>
                        <OrbitControls />
                        <Environment preset="sunset" />
                        <Field3D state={simState} />
                    </Canvas>
                </div>

                {/* Log Overlay */}
                <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                    <div className="max-w-xl bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-4 text-xs font-mono max-h-32 overflow-hidden text-neutral-300">
                        {simState.event_log.slice(0, 3).map((log, i) => (
                            <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">
                                <span className="text-emerald-500 mr-2">➜</span> {log}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
