import { DbConfigService } from '../services/DbConfigService';
import { SimpleAdminDBApp } from '../app/SimpleAdminDBApp';
import { CeService } from '../core/CeService';
import { ContextService } from '../services/ContextService';

async function bootstrap() {

    const context = CeService.get(ContextService);    
    const admin = CeService.get(DbConfigService);   

    await SimpleAdminDBApp.init();            
    await admin.clearDatabase();
    await SimpleAdminDBApp.close();
}

bootstrap();
