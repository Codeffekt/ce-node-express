import { DbConfigService } from '../services/DbConfigService';
import { SimpleAdminDBApp } from '../app/SimpleAdminDBApp';
import { CeService } from '../core/CeService';
import { ContextService } from '../services/ContextService';
import { SimpleDBApp } from '../app/SimpleDBApp';

async function bootstrap() {

    const context = CeService.get(ContextService);
    const admin = CeService.get(DbConfigService);    

    await SimpleAdminDBApp.init();            
    await admin.initDatabase();
    await SimpleAdminDBApp.close();

    await SimpleDBApp.init();
    await admin.initTables();
    await SimpleDBApp.close();
}

bootstrap();
