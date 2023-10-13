import { Pool, PoolConfig } from "pg";
import { Service } from "../core/CeService";

@Service()
export class GisDatabase {

    poolGis: Pool;

    constructor() { }

    async setConfig(configGis: PoolConfig) {
        await this.close();
        this.poolGis = new Pool(configGis);
        return this;
    }

    async close() {
        if (this.poolGis) {
            await this.poolGis.end();
            this.poolGis = undefined;
            console.log("End of GisDatabase connection");
        }        
        return true;
    }

}