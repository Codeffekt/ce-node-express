import { AssetsApiServer, CeService, ExpressApplication, FormsApiServer } from "../src";

CeService.get(ExpressApplication).runAppFromEnv("Trias API", {
    routers: [
        CeService.get(FormsApiServer),
        CeService.get(AssetsApiServer),
    ]
});

