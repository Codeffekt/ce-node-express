import * as express from "express";
import { Request, Response } from "express";
import { Service } from "../core/CeService";
import { Controller, ExpressRouter, Get } from "../express-router/ExpressRouter";

export interface ProcessingApplicationConfig {
    task: () => Promise<void>;
}

@Service()
@Controller({ path: '/' })
export class ProcessingApplication {

    private app: express.Application;

    constructor() {}

    async runAppFromEnv() {

        this.app = express();

        ExpressRouter.use(this, this.app);

        const port = 4002;

        this.app.listen({ port }, () => {
            console.log(`Start processing server at http://localhost:${port}`)
        });

        return this.app;

    }

    @Get({ path: '/start'})
    start(req: Request, res: Response) {
        res.json({ test: true });
    }
}