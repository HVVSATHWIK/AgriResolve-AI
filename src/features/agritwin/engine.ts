import { SimulationState, CROP_LIBRARY, SoilHealthCard, CropType } from './types';

// Simplified WOFOST/AquaCrop Implementation for JS Client
export class AgriTwinEngine {
    state: SimulationState;
    initialSHC: SoilHealthCard;
    targetYield: number; // q/ha

    constructor(shc: SoilHealthCard, cropType: CropType, startDate: string = "2024-06-15") {
        this.initialSHC = shc;
        const cropConfig = CROP_LIBRARY[cropType];

        // Initial State
        this.state = {
            day: 1,
            date: startDate,
            crop: {
                type: cropType,
                name: cropConfig.name,
                variety: "High Yielding",
                dvs: 0.0,
                biomass: 50, // Initial seed mass
                lai: 0.02,
                height: 5,
                roots: 5,
                health: 100
            },
            soil: {
                moisture: 100, // % Field Capacity (assume started wet)
                n_pool: shc.N, // Initial from Soil Test
                p_pool: shc.P,
                k_pool: shc.K
            },
            weather: {
                temp_max: 30,
                temp_min: 22,
                rain: 0,
                radiation: 20
            },
            stress: { water: 0, nitrogen: 0, heat: 0 },
            yield_forecast: 0,
            event_log: ["Simulation Initialized. Seedbed prepared."]
        };

        // Default Target (70% of potential)
        this.targetYield = (cropConfig.potential_yield / 100) * 0.7; // converts kg/ha -> q/ha roughly just for logic
    }

    // Main Loop: Step forward one day
    public nextDay(actions: { irrigate?: number; fertilize_n?: number }): SimulationState {
        this.state.day++;

        // 1. Weather Generator (Stochastic for now)
        this.generateWeather();

        // 2. Hydrology (Water Balance)
        this.simulateHydrology(actions.irrigate || 0);

        // 3. Nutrient Balance
        this.simulateNutrients(actions.fertilize_n || 0);

        // 4. Crop Growth (WOFOST Logic)
        this.simulateGrowth();

        return { ...this.state };
    }

    private generateWeather() {
        // Bias weather based on day of year (Simple Sine wave for temp)
        const t_variation = Math.sin(this.state.day / 60) * 5;
        this.state.weather.temp_max = 32 + t_variation + (Math.random() * 2);
        this.state.weather.temp_min = 24 + t_variation - (Math.random() * 2);

        // Rain Event (Probabilistic)
        if (Math.random() < 0.15) {
            this.state.weather.rain = Math.random() * 40; // 0-40mm
            this.state.weather.radiation = 10; // Cloudy
        } else {
            this.state.weather.rain = 0;
            this.state.weather.radiation = 22; // Sunny
        }
    }

    private simulateHydrology(irrigation: number) {
        const crop = CROP_LIBRARY[this.state.crop.type];
        const ET0 = 5; // Reference Evapotranspiration (mm/day) - approximated
        const Kc = 0.4 + (this.state.crop.lai / 3); // Crop Coefficient increases with canopy
        const ETc = ET0 * Math.min(Kc, 1.2);

        // Water In: Rain + Irrigation
        const waterIn = this.state.weather.rain + irrigation;

        // Water Out: ETc
        const soilBucketChange = waterIn - ETc;

        // Update Soil Moisture
        this.state.soil.moisture += (soilBucketChange / 2); // Simplified Capacity
        this.state.soil.moisture = Math.max(0, Math.min(100, this.state.soil.moisture));

        // Stress Calculation
        if (this.state.soil.moisture < 30) {
            this.state.stress.water = (30 - this.state.soil.moisture) / 30; // 0 to 1
            if (this.state.stress.water > 0.5) this.log("⚠️ Water Stress Detected!");
        } else {
            this.state.stress.water = 0;
        }

        if (irrigation > 0) this.log(`Irrigated ${irrigation}mm.`);
    }

    private simulateNutrients(fertilizer: number) {
        // Mineralization (Soil releases N slowly)
        const mineralization = 0.5; // kg/ha/day

        // Uptake (Demand driven by growth)
        const uptakeDemand = this.state.crop.lai * 1.5; // kg/ha/day

        // Balance
        this.state.soil.n_pool += (fertilizer + mineralization) - uptakeDemand;
        this.state.soil.n_pool = Math.max(0, this.state.soil.n_pool);

        // Stress
        if (this.state.soil.n_pool < 20) {
            this.state.stress.nitrogen = (20 - this.state.soil.n_pool) / 20;
            if (this.state.stress.nitrogen > 0.5) this.log("⚠️ Nitrogen Deficiency!");
        } else {
            this.state.stress.nitrogen = 0;
        }

        if (fertilizer > 0) this.log(`Applied ${fertilizer} kg N.`);
    }

    private simulateGrowth() {
        const config = CROP_LIBRARY[this.state.crop.type];

        // 1. Phenology
        // DVS Rate depends on Temp (Degree Days)
        const avgTemp = (this.state.weather.temp_max + this.state.weather.temp_min) / 2;
        const dailyHeatUnits = Math.max(0, avgTemp - config.base_temp);
        const totalHeatUnitsNeeded = 1800; // illustrative
        const dvsRate = dailyHeatUnits / totalHeatUnitsNeeded;

        this.state.crop.dvs += dvsRate * 2; // Speed up strictly for UI demo feel

        // 2. Visual Growth
        if (this.state.crop.dvs < 1.0) {
            // Vegetative
            const stressFactor = Math.min(1 - this.state.stress.water, 1 - this.state.stress.nitrogen);

            this.state.crop.lai += 0.1 * stressFactor;
            this.state.crop.lai = Math.min(this.state.crop.lai, config.max_lai);

            this.state.crop.height += 2 * stressFactor;
            this.state.crop.biomass += 50 * stressFactor;
        } else {
            // Reproductive (Grain filling)
            const stressFactor = Math.min(1 - this.state.stress.water, 1 - this.state.stress.heat);
            this.state.yield_forecast += 20 * stressFactor;
        }

        // Health
        this.state.crop.health = 100 * (1 - Math.max(this.state.stress.water, this.state.stress.nitrogen, this.state.stress.heat));
    }

    private log(msg: string) {
        this.state.event_log.unshift(`Day ${this.state.day}: ${msg}`);
        if (this.state.event_log.length > 10) this.state.event_log.pop();
    }
}
