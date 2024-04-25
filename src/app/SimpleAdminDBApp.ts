import { DbConfigService } from "../services/DbConfigService";
import * as dotenv from "dotenv";
import { CeService } from "../core/CeService";
import { ContextService } from "../services/ContextService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { AccountsService } from "../services/AccountsService";
import { ProjectsService } from "../services/ProjectsService";
import { FormsService } from "../services/FormsService";
import { SimpleDBConnect } from "./SimpleDBConnect";

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
    
        const admin = CeService.get(DbConfigService);
        
        admin.setConfig(adminConfig);    

        await SimpleDBConnect.connectAdminToAdminDB();

        await admin.initDatabase();

        await SimpleDBConnect.connectAdminToFormsDB();

        await admin.initPublicPrivileges();
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

export const SimpleAdminDBApp = new SimpleAdminDBAppImpl();