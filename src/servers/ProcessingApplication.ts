import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { CeService, Inject, Service } from "../core/CeService";
import { Controller, ExpressRouter, Get } from "../express-router/ExpressRouter";
import { Task } from "../processing/Task";
import { RemoteApiService } from "../services/RemoteApiService";
import { FormInstanceExt, FormWrapper, IndexType, ProcessingStatus } from "@codeffekt/ce-core-data";

export interface ProcessingApplicationConfig {
    task: Task;
    server?: string;
    token?: string;
}

@Service()
@Controller({ path: '/' })
export class ProcessingApplication {

    private app: express.Application;
    private config: ProcessingApplicationConfig;
    private processing: FormInstanceExt;

    @Inject(RemoteApiService)
    private readonly remoteApiService: RemoteApiService;

    constructor() { }

    setConfig(config: ProcessingApplicationConfig) {
        this.config = config;
    }

    async runAppFromEnv(config: ProcessingApplicationConfig) {

        this.config = config;

        this.initRemoteApi();

        this.app = express();

        ExpressRouter.use(this, this.app);

        const port = 4002;

        this.app.listen({ port }, () => {
            console.log(`Start processing server at http://localhost:${port}`)
        });

        return this.app;

    }

    @Get({ path: '/processing/:pid' })
    async start(req: Request, res: Response, next: NextFunction) {
        try {           

            const pid = req.params.pid;
            
            if (this.isCurrentProcessing(pid)) {
                res.json(this.processing);
                return;
            }

            if (this.haveProcessing()) {
                throw new Error(`A processing is running ${this.processing.id}. No more processing available`);
            }

            await this.retrieveProcessing(pid);
            
            await this.config.task.run(this.processing);

            res.json(this.processing);
        } catch (err) {
            next(err);
        }
    }

    @Get({ path: '/cancel/:pid' })
    async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const pid = req.params.pid;

            if (!this.isCurrentProcessing(pid)) {
                throw new Error(`Unknown processing id ${pid}`);
            }            

            await this.config.task.cancel();

            res.json(this.processing);
        } catch (err) {
            next(err);
        }
    }

    @Get({ path: '/' })
    status(req: Request, res: Response, next: NextFunction) {
        try {
            if (this.haveProcessing()) {
                res.json(this.config.task.status());
            } else {
                res.json({})
            }
        } catch (err) {
            next(err);
        }
    }

    /* async test_start(pid: IndexType) {

        this.initRemoteApi();

        if (this.processing && this.processing.id !== pid) {
            throw new Error(`A processing is still running ${this.processing.id}`);
        }

        if (this.processing) {
            if (this.processing.id === pid && FormWrapper.getFormValue("status", this.processing) === "RUNNING") {
                return;
            }
        }

        await this.retrieveProcessing(pid);

        return this.config.task.run(this.processing);
    } */   

    private haveProcessing() {
        return this.config.task.haveProcessing();
    }

    private isCurrentProcessing(pid: IndexType) {
        return this.config.task.isCurrentProcessing(pid);
    }

    private initRemoteApi() {
        this.remoteApiService.setConfig({
            server: this.config.server ?? process.env.CE_FORMS_BASE_URL,
            learning: null,
            token: this.config.token ?? process.env.CE_FORMS_TOKEN,
        });
    }

    private async retrieveProcessing(pid: IndexType) {
        console.log("Processing Application retrieveProcessing", pid);
        this.processing = await this.remoteApiService.getFormQueryGeneric(pid, {
            extMode: true
        });

        if (!this.processing) {
            throw new Error(`Processing ${pid} not found`);
        }
    }
}