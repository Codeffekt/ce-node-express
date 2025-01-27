import * as dotenv from "dotenv";
import { PoolConfig } from "pg";
import { CeService, Service } from "../core/CeService";
import { MessagesServer, MessagesServerConfig } from "./MessagesServer";
import { ContextService } from "../services/ContextService";
import { DatabaseServer } from "./DatabaseServer";
import { FormsMessagesQueues } from "../forms";

export interface MessagesApplicationConfig {
    contextRoot: string;
    pgConfig: PoolConfig;
    msgConfig: MessagesServerConfig;
}

@Service()
export class MessagesApplication {

    private config: MessagesApplicationConfig;

    constructor() {

    }

    async runAppFromEnv(options?: Partial<MessagesApplicationConfig>) {
        dotenv.config({ path: process.env.ENV_SCRIPT || "dist/.env.config" });
        await this.createApp({
            contextRoot: process.env.CONTEXT_ROOT || "data/",
            pgConfig: {
                host: process.env.PGHOST,
                user: process.env.PGUSER,
                password: process.env.PGPASSWD,
                database: process.env.PGDB,
                port: parseInt(process.env.PGPORT!)
            },
            msgConfig: {
                url: process.env.MSG_URL || "amqp://guest:guest@127.0.0.1:5672",
                queues: process.env.MSG_QUEUES ? process.env.MSG_QUEUES.split(",") : FormsMessagesQueues.QUEUES,
            },
        })        
    }

    async createApp(config: MessagesApplicationConfig) {

        this.config = config;

        CeService.get(ContextService).setRoot(config.contextRoot);
        await CeService.get(DatabaseServer).setConfig(config.pgConfig);
        await CeService.get(MessagesServer).setConfig(config.msgConfig);
    }

    async close() {
        await CeService.get(DatabaseServer).close();
        await CeService.get(MessagesServer).close();
    }
}