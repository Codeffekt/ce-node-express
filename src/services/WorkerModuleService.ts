import { Service } from "../core/CeService";

export interface WorkerModuleServiceConfig {
    workerModulePath: string;
}

@Service()
export class WorkerModuleService {

    private config: WorkerModuleServiceConfig = {
        workerModulePath: "./ce-node-worker.cjs"
    };

    constructor() {}

    setConfig(config: WorkerModuleServiceConfig) {
        this.config = config;
    }

    getWorkerModulePath() {
        return this.config.workerModulePath;
    }
}