export type SoilType = 'SANDY' | 'LOAMY' | 'CLAY';

export interface SimulationState {
    day: number;
    funds: number;
    health: number; // 0-100
    stage: 'SEED' | 'SEEDLING' | 'VEGETATIVE' | 'FLOWERING' | 'HARVEST' | 'DEAD';
    waterLevel: number; // 0-100
    nitrogenLevel: number; // 0-100
    pestLevel: number; // 0-100 (0 is good)
    weather: 'SUNNY' | 'RAIN' | 'DROUGHT' | 'STORM';
    soilType: SoilType;
    log: string[];
}

export type ActionType = 'WATER' | 'FERTILIZE' | 'PESTICIDE' | 'HARVEST' | 'NEXT_DAY';

// Soil Constants
const SOIL_PROPERTIES = {
    SANDY: { drainage: 25, nutrientLeak: 5, retention: 0.5 },
    LOAMY: { drainage: 10, nutrientLeak: 2, retention: 1.0 },
    CLAY: { drainage: 5, nutrientLeak: 1, retention: 1.5 }
};

const PEST_GROWTH_RATE = 5;

export class SimulationEngine {
    state: SimulationState;

    constructor(initialSoil: SoilType = 'LOAMY') {
        this.state = {
            day: 1,
            funds: 1000,
            health: 100,
            stage: 'SEED',
            waterLevel: 50,
            nitrogenLevel: 50,
            pestLevel: 0,
            weather: 'SUNNY',
            soilType: initialSoil,
            log: [`Simulation started. Soil: ${initialSoil}.`]
        };
    }

    getState(): SimulationState {
        return { ...this.state };
    }

    setSoilType(soil: SoilType) {
        this.state.soilType = soil;
        this.log(`Soil changed to ${soil}.`);
    }

    performAction(action: ActionType): SimulationState {
        if (this.state.stage === 'DEAD') return this.state;

        switch (action) {
            case 'WATER':
                this.water();
                break;
            case 'FERTILIZE':
                this.fertilize();
                break;
            case 'PESTICIDE':
                this.applyPesticide();
                break;
            case 'HARVEST':
                this.harvest();
                break;
            case 'NEXT_DAY':
                this.advanceDay();
                break;
        }
        return this.getState();
    }

    private water() {
        if (this.state.funds < 10) {
            this.log('Not enough funds to water!');
            return;
        }
        this.state.funds -= 10;
        this.state.waterLevel = Math.min(100, this.state.waterLevel + 30);
        this.log('Watered crop (+30 hydration).');
    }

    private fertilize() {
        if (this.state.funds < 50) {
            this.log('Not enough funds for fertilizer!');
            return;
        }
        this.state.funds -= 50;
        const soil = this.state.soilType;
        // Clay holds nutrients better than Sand
        const efficiency = soil === 'CLAY' ? 50 : (soil === 'SANDY' ? 30 : 40);

        this.state.nitrogenLevel = Math.min(100, this.state.nitrogenLevel + efficiency);
        this.log(`Applied fertilizer (+${efficiency} nitrogen).`);
    }

    private applyPesticide() {
        if (this.state.funds < 100) {
            this.log('Not enough funds for pesticide!');
            return;
        }
        this.state.funds -= 100;
        this.state.pestLevel = Math.max(0, this.state.pestLevel - 50);
        this.log('Sprayed pesticide (reduced pests).');
    }

    private harvest() {
        if (this.state.stage === 'HARVEST') {
            const yieldScore = (this.state.health / 100) * 5000;
            this.state.funds += yieldScore;
            this.log(`Harvest successful! Sold for ₹${Math.floor(yieldScore)}.`);
            this.state.stage = 'SEED'; // Reset or End? Let's reset for endless mode
            this.state.day = 1;
            this.state.health = 100;
        } else {
            this.log('Not ready to harvest yet!');
        }
    }

    private advanceDay() {
        this.state.day += 1;

        // randomize weather each day
        const rand = Math.random();
        if (rand < 0.6) this.state.weather = 'SUNNY';
        else if (rand < 0.8) this.state.weather = 'RAIN';
        else if (rand < 0.9) this.state.weather = 'DROUGHT';
        else this.state.weather = 'STORM';

        // Effects via Soil Physics
        const props = SOIL_PROPERTIES[this.state.soilType];

        let waterChange = -props.drainage; // Baseline drainage
        if (this.state.weather === 'SUNNY') waterChange -= 5; // Evaporation
        if (this.state.weather === 'RAIN') waterChange += (20 * props.retention); // Clay holds more rain
        if (this.state.weather === 'DROUGHT') waterChange -= 10;

        this.state.waterLevel = Math.max(0, Math.min(100, this.state.waterLevel + waterChange));
        this.state.nitrogenLevel = Math.max(0, this.state.nitrogenLevel - props.nutrientLeak);
        this.state.pestLevel = Math.min(100, this.state.pestLevel + (Math.random() > 0.7 ? PEST_GROWTH_RATE : 0));

        // Calculate Health Impact
        let healthChange = 0;
        // Clay risks waterlogging logic
        if (this.state.soilType === 'CLAY' && this.state.waterLevel > 80) {
            healthChange -= 3; // Root rot risk
        }
        if (this.state.waterLevel < 10 || this.state.waterLevel > 90) healthChange -= 5;
        if (this.state.nitrogenLevel < 10) healthChange -= 2;
        if (this.state.pestLevel > 50) healthChange -= 5;

        this.state.health = Math.max(0, Math.min(100, this.state.health + healthChange));

        // Growth Stages
        if (this.state.health <= 0) {
            this.state.stage = 'DEAD';
            this.log('Crop died due to poor health.');
        } else {
            // Simplified growth logic
            if (this.state.day === 5) this.state.stage = 'SEEDLING';
            if (this.state.day === 15) this.state.stage = 'VEGETATIVE';
            if (this.state.day === 30) this.state.stage = 'FLOWERING';
            if (this.state.day === 45) this.state.stage = 'HARVEST';
        }

        this.log(`Day ${this.state.day}: ${this.state.weather}. Health: ${this.state.health}%`);
    }

    private log(msg: string) {
        this.state.log.unshift(msg);
        if (this.state.log.length > 20) this.state.log.pop();
    }
}
