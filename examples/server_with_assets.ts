import { AssetsApiServer, CeService, ExpressApplication, FormsApiServer } from "../src";

CeService.get(ExpressApplication).runAppFromEnv("Server with assets", {
    routers: [
        CeService.get(FormsApiServer),
        CeService.get(AssetsApiServer),
    ]
});

