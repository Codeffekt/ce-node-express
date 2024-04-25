import { CeService } from "../core/CeService";
import { DbConfigService } from "../services/DbConfigService";
import { CeFormsInitService } from "../services/CeFormsInitService";
import { SimpleAdminDBApp } from "../app/SimpleAdminDBApp";
import { SimpleDBApp } from "../app/SimpleDBApp";

async function bootstrap() {

    const admin = CeService.get(DbConfigService);
    const initService = CeService.get(CeFormsInitService);

    await SimpleAdminDBApp.init();
    await admin.initDatabase();
    await SimpleAdminDBApp.close();

    await SimpleDBApp.init();
    await initService.init({        
        defaultAccount: {
            login: process.env.CE_FORMS_LOGIN,
            account: process.env.CE_FORMS_ACCOUNT,
            passwd: process.env.CE_FORMS_PASSWD,
        },
        clearTables: true
    });
    await SimpleDBApp.close();
}

bootstrap();
