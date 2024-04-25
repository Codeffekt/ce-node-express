import * as dotenv from "dotenv";
import { CeService } from "../core/CeService";
import { ContextService } from "../services/ContextService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { AccountsService } from "../services/AccountsService";
import { ProjectsService } from "../services/ProjectsService";
import { FormsService } from "../services/FormsService";
import { SimpleDBConnect } from "./SimpleDBConnect";

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

            await SimpleDBConnect.connectDefaultUserToFormsDB();

            await SimpleDBConnect.connectDefaultUserToGisDB();     
        }
    }

    async close() {
       await SimpleDBConnect.close();        
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