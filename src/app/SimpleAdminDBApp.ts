import { DbConfigService } from "../services/DbConfigService";
import * as dotenv from "dotenv";
import { CeService } from "../core/CeService";
import { ContextService } from "../services/ContextService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { AccountsService } from "../services/AccountsService";
import { ProjectsService } from "../services/ProjectsService";
import { FormsService } from "../services/FormsService";

export class SimpleAdminDBAppImpl {
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

        const adminConfig = {
            dbName: process.env.PGDB,
            userName: process.env.PGUSER,
            password: process.env.PGPASSWD
        };
    
        if(!adminConfig.dbName || !adminConfig.userName || !adminConfig.password) {
            throw new Error("Missing DB parameters PGUSER, PGDB or PGPASSWD");
        }
    
        CeService.get(DbConfigService).setConfig(adminConfig);    

        await CeService.get(DatabaseServer).setConfig({
            host: process.env.PGHOST,
            user: process.env.PG_ADMIN_USER || "postgres",
            password: process.env.PG_ADMIN_PASSWD || "postgres",
            database: process.env.PG_ADMIN_DB || "postgres",
            port: parseInt(process.env.PGPORT)
        });
    }

    async close() {
        await CeService.get(DatabaseServer).close();        
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

export const SimpleAdminDBApp = new SimpleAdminDBAppImpl();