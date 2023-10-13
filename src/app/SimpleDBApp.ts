import { GisDatabase } from "../servers/GisDatabase";
import * as dotenv from "dotenv";
import { CeService } from "../core/CeService";
import { ContextService } from "../services/ContextService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { AccountsService } from "../services/AccountsService";
import { ProjectsService } from "../services/ProjectsService";
import { FormsService } from "../services/FormsService";

export class SimpleDBAppImpl {
    constructor() {
    }

    async init() {

        // you can substiture your own env script by doing 
        // ENV_SCRIPT=<path> node <script>
        const envScript = process.env.ENV_SCRIPT || ".env.scripts";

        // Load environment variables from .env file, where API keys and passwords are configured
        dotenv.config({ path: envScript });

        if (process.env.CONTEXT_ROOT) {
            CeService.get(ContextService).setRoot(process.env.CONTEXT_ROOT);
        }

        if (process.env.USE_MEMORY_DB) {
            throw new Error("Memory DB not used anymore");
        } else {

            await CeService.get(DatabaseServer).setConfig({
                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWD,
                database: process.env.PGDB,
                port: parseInt(process.env.PGPORT)
            });

            await CeService.get(GisDatabase).setConfig({
                host: process.env.PGHOST_GIS,
                user: process.env.PGUSER_GIS,
                password: process.env.PGPASSWD_GIS,
                database: process.env.PGDB_GIS,
                port: parseInt(process.env.PGPORT_GIS)
            });            
        }
    }

    async close() {
        await CeService.get(DatabaseServer).close();
        await CeService.get(GisDatabase).close();        
    }

    getContext(): ContextService {        
        return CeService.get(ContextService);
    }

    getDatabase(): DatabaseServer {
        return CeService.get(DatabaseServer);
    }

    getAccountService(): AccountsService {
        return CeService.get(AccountsService);
    }

    getProjectService(): ProjectsService {
        return CeService.get(ProjectsService);
    }

    getFormsService(): FormsService {
        return CeService.get(FormsService);
    }
}

export const SimpleDBApp = new SimpleDBAppImpl();