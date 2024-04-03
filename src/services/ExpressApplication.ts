import * as express from "express";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as cookieParser from "cookie-parser";
import * as compression from "compression";
import * as winston from 'winston';
import * as expressWinston from 'express-winston';
import { AuthServer } from "../servers/AuthServer";
import { ExpressRouter } from "../express-router/ExpressRouter";
import { ErrorServer } from "../servers/ErrorServer";
import { PoolConfig } from "pg";
import { DatabaseServer } from "../servers/DatabaseServer";
import { AuthService, AuthServiceConfig } from './AuthService';
import { CeService, Service } from "../core/CeService";
import { ContextService } from "./ContextService";

export interface ExpressApplicationConfig {
    contextRoot: string;
    authConfig: AuthServiceConfig;
    pgConfig: PoolConfig;
    corsConfig?: any;
    routers: any[];
    jsonConfig?: { limit: string | number };
}

@Service()
export class ExpressApplication {

    private app: express.Application;
    private config: ExpressApplicationConfig;
    private server: any;

    constructor(
    ) {
    }

    async runAppFromEnv(appName: string, options?: Partial<ExpressApplicationConfig>) {
        dotenv.config({ path: process.env.ENV_SCRIPT || "dist/.env.config" });
        const app = await this.createApp({
            contextRoot: process.env.CONTEXT_ROOT || "data/",
            pgConfig: {
                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWD,
                database: process.env.PGDB,
                port: parseInt(process.env.PGPORT!)
            },
            authConfig: {
                env: process.env,
                secret: process.env.JWT_SECRET!,
                sub: process.env.JWT_AUD!,
                aud: process.env.JWT_SUB!,
                tokenProvider: process.env.JWT_FORMAT || "default",
                uidFieldName: process.env.JWT_UID_FIELD,
                jwtExpiration: parseInt(process.env.JWT_EXPIRATION),
                jwtRefreshExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION),
            },
            corsConfig: {
                origin: ['http://localhost:4200', 'http://localhost:4201', 'http://localhost:4202'],
                optionsSuccessStatus: 200,
                credentials: true

            },
            routers: [],
            ...options,
        });

        const port = process.env.PORT || 3000;
        const version = process.env.VERSION || "unknown";

        this.server = app.listen({ port: port }, () => {
            console.log(`🚀 ${appName} version ${version} ready at http://localhost:${port}`);
        });

        return app;
    }

    async stop() {
        await CeService.get(DatabaseServer).close();
        return new Promise((resolve, reject) => {            
            this.server.close((err) => {                
                if (err) {
                    reject(err);
                }
                resolve(1);
            });
        });
    }

    async createApp(config: ExpressApplicationConfig) {

        this.config = config;

        CeService.get(ContextService).setRoot(config.contextRoot);

        await CeService.get(DatabaseServer).setConfig(config.pgConfig);
        CeService.get(AuthService).setConfig(config.authConfig);

        this.app = express();
        this.app.use(cors(this.config.corsConfig));
        this.app.use(compression());
        this.app.use(cookieParser());
        this.app.use(express.json(this.config.jsonConfig || { limit: '1000kb' }));
        this.app.use(express.urlencoded({ extended: true }));

        this.app.use(expressWinston.logger({
            transports: [
                new winston.transports.Console()
            ],
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.json()
            ),
            meta: true, // optional: control whether you want to log the meta data about the request (default to true)
            msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
            expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
            colorize: false, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
            ignoreRoute: function (req, res) { return false; }
        }));

        const authServer = CeService.get(AuthServer);
        ExpressRouter.use(authServer, this.app);
        config.routers.forEach(router => ExpressRouter.use(router, this.app));
        ExpressRouter.use(CeService.get(ErrorServer), this.app);

        return this.app;
    }

    getApp() {
        return this.app;
    }

    getConfig() {
        return this.config;
    }
}