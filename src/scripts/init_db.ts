import { parse } from "ts-command-line-args";
import { CeService } from "../core/CeService";
import { ContextService } from "../services/ContextService";
import { DbConfigService } from "../services/DbConfigService";
import { CeFormsInitService } from "../services/CeFormsInitService";
import { SimpleAdminDBApp } from "../app/SimpleAdminDBApp";
import { SimpleDBApp } from "../app/SimpleDBApp";

interface IScriptArgs {    
    defaultAccount: string;
    defaultLogin: string;
    defaultPassword: string;
    help?: boolean;
}

export const args = parse<IScriptArgs>(
    {       
        defaultAccount: { type: String, description: 'Main account name' } as any,
        defaultLogin: { type: String, description: 'Main account login' } as any,
        defaultPassword: { type: String, description: 'Main account password' } as any,
        help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide' },
    },
    {
        helpArg: 'help',
        headerContentSections: [{
            header: 'Ce-Forms database initialisation',
            content: 'Create the tables and add the admin and default account.'
        }],
    }
);

async function bootstrap() {

    const context = CeService.get(ContextService);
    const admin = CeService.get(DbConfigService);
    const initService = CeService.get(CeFormsInitService);

    await SimpleAdminDBApp.init();
    await admin.initDatabase();
    await SimpleAdminDBApp.close();

    await SimpleDBApp.init();
    await initService.init({        
        defaultAccount: {
            login: args.defaultLogin,
            account: args.defaultAccount,
            passwd: args.defaultPassword
        }
    });
    await SimpleDBApp.close();
}

bootstrap();
