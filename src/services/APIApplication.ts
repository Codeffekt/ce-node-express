import * as express from "express";
import * as cors from "cors";
import { Server } from "http";
import { CeService, Service } from "../core/CeService";
import { ExpressRouter } from "../express-router/ExpressRouter";
import { ErrorServer } from "../servers/ErrorServer";

export interface APIApplicationConfig {
    routers: any[];
    corsConfig?: any;
}

@Service()
export class APIApplication {
    
    private app: express.Application;
    private server: Server;
    private config: APIApplicationConfig;

    constructor() {}

    async runAppFromEnv(appName: string, config: APIApplicationConfig) {

        this.config = config;

        this.app = express();
        this.app.use(cors(this.config.corsConfig));
        this.app.use(express.json({ limit: '1000kb' }));
        this.app.use(express.urlencoded({ extended: true }));

        this.config.routers.forEach(router => ExpressRouter.use(router, this.app));
        ExpressRouter.use(CeService.get(ErrorServer), this.app);

        const port = process.env.PORT || 3000;
        const version = process.env.VERSION || "unknown";

        this.server = this.app.listen({ port: port }, () => {
            console.log(`🚀 ${appName} version ${version} ready at http://localhost:${port}`);
        });

        return this.app;
    }
}
