import * as express from "express";
import * as cors from "cors";
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

export interface ExpressApplicationConfig {
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

    constructor(
    ) {
    }

    async createApp(config: ExpressApplicationConfig) {

        this.config = config;

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