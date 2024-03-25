import { ProcessingApplication } from "../../src/servers/ProcessingApplication";
import { CeService } from "../../src/core/CeService"
import { FormsApiServer } from "../../src/servers/FormsApiServer";
import { ExpressApplication } from "../../src/services/ExpressApplication";

async function bootstrap() {

    CeService.get(ExpressApplication).runAppFromEnv("Processing test", {
        routers: [
            CeService.get(FormsApiServer),
        ]
    });

    CeService.get(ProcessingApplication).runAppFromEnv();
}

bootstrap();



