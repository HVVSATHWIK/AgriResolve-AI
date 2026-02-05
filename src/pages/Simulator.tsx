import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2, Droplets, Sprout, Skull, DollarSign } from 'lucide-react';
import { SimulationEngine, SimulationState } from '../features/simulation/SimulationEngine';
import { SimulationCanvas } from '../features/simulation/SimulationCanvas';

export const Simulator: React.FC = () => {
    const { t } = useTranslation();
    const engineRef = useRef<SimulationEngine>(new SimulationEngine());
    const [gameState, setGameState] = useState<SimulationState>(engineRef.current.getState());

    const handleAction = (action: 'WATER' | 'FERTILIZE' | 'PESTICIDE' | 'HARVEST' | 'NEXT_DAY') => {
        engineRef.current.performAction(action);
        setGameState(engineRef.current.getState());
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 md:pb-8 p-4 md:p-8">
            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Header - Full Width */}
                <div className="lg:col-span-3 flex justify-between items-center mb-2">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Gamepad2 className="w-8 h-8 text-indigo-600" />
                            {t('agri_twin', { defaultValue: 'Agri-Twin Simulator' })}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {t('simulator_subtitle', { defaultValue: 'Risk-free farming component.' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                        <DollarSign className="w-5 h-5 text-green-600" />
                        <span className="text-xl font-bold text-gray-800">{Math.floor(gameState.funds)}</span>
                    </div>
                </div>

                {/* Left Column: 3D Canvas */}
                <div className="lg:col-span-2 space-y-4">
                    <SimulationCanvas state={gameState} />

                    {/* Stats Bar */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Health</span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${gameState.health}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Water</span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${gameState.waterLevel}%` }}></div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                            <span className="text-gray-400 text-xs font-bold uppercase block mb-1">Nutrients</span>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-amber-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${gameState.nitrogenLevel}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Soil Type Selector */}
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                        <div>
                            <span className="text-gray-400 text-xs font-bold uppercase block">Soil Type</span>
                            <span className="text-sm text-gray-600">Affects water retention</span>
                        </div>
                        <select
                            value={gameState.soilType}
                            onChange={(e) => {
                                const newType = e.target.value as any;
                                engineRef.current.setSoilType(newType);
                                setGameState(engineRef.current.getState());
                            }}
                            disabled={gameState.day > 1}
                            className={`border-gray-300 rounded-lg text-sm font-bold ${gameState.day > 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-50 text-gray-800'
                                }`}
                        >
                            <option value="LOAMY">Loamy (Balanced)</option>
                            <option value="SANDY">Sandy (Drains Fast)</option>
                            <option value="CLAY">Clay (Retains Water)</option>
                        </select>
                    </div>
                </div>

                {/* Right Column: Controls & Log */}
                <div className="space-y-6">

                    {/* Control Panel */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">{t('actions', { defaultValue: 'Actions' })}</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleAction('WATER')}
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors"
                                disabled={gameState.stage === 'DEAD'}
                            >
                                <Droplets className="w-6 h-6 text-blue-600 mb-1" />
                                <span className="text-xs font-bold text-blue-800">Water (-₹10)</span>
                            </button>

                            <button
                                onClick={() => handleAction('FERTILIZE')}
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors"
                                disabled={gameState.stage === 'DEAD'}
                            >
                                <Sprout className="w-6 h-6 text-amber-600 mb-1" />
                                <span className="text-xs font-bold text-amber-800">Fertilize (-₹50)</span>
                            </button>

                            <button
                                onClick={() => handleAction('PESTICIDE')}
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors"
                                disabled={gameState.stage === 'DEAD'}
                            >
                                <Skull className="w-6 h-6 text-purple-600 mb-1" />
                                <span className="text-xs font-bold text-purple-800">Pesticide (-₹100)</span>
                            </button>

                            <button
                                onClick={() => handleAction('HARVEST')}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${gameState.stage === 'HARVEST' ? 'bg-green-600 border-green-700 text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                                disabled={gameState.stage !== 'HARVEST'}
                            >
                                <DollarSign className="w-6 h-6 mb-1" />
                                <span className="text-xs font-bold">Harvest</span>
                            </button>

                            <button
                                onClick={() => handleAction('NEXT_DAY')}
                                className="col-span-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md transition-colors"
                            >
                                Next Day ({gameState.day} → {gameState.day + 1})
                            </button>
                        </div>
                    </div>

                    {/* Event Log */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 h-64 overflow-y-auto font-mono text-xs">
                        <ul className="space-y-2">
                            {gameState.log.map((msg, i) => (
                                <li key={i} className="border-b border-gray-50 pb-1 last:border-0 text-gray-600">
                                    {i === 0 ? <span className="text-indigo-600 font-bold">➤ {msg}</span> : msg}
                                </li>
                            ))}
                        </ul>
                    </div>

                </div>

            </div>
        </div>
    );
};
