import * as express from "express";
import { Request, Response, NextFunction } from "express";
import { Service } from "../core/CeService";
import { Controller, ExpressRouter, Get } from "../express-router/ExpressRouter";

export interface ProcessingApplicationConfig {
    task: () => Promise<void>;
}

@Service()
@Controller({ path: '/' })
export class ProcessingApplication {

    private app: express.Application;

    constructor() { }

    async runAppFromEnv() {

        this.app = express();

        ExpressRouter.use(this, this.app);

        const port = 4002;

        this.app.listen({ port }, () => {
            console.log(`Start processing server at http://localhost:${port}`)
        });

        return this.app;

    }

    @Get({ path: '/processing/:pid' })
    start(req: Request, res: Response, next: NextFunction) {
        try {
            console.log(`Receive start for pid ${req.params.pid}`);
            res.json({ test: true });
        } catch (err) {
            next(err);
        }
    }

    @Get({ path: '/cancel/:pid'})
    cancel(req: Request, res: Response, next: NextFunction) {
        try {
            console.log(`Receive cancel for pid ${req.params.pid}`);
            res.json({ test: true });
        } catch (err) {
            next(err);
        }
    }

    @Get({ path: '/'})
    status(req: Request, res: Response, next: NextFunction) {
        try {
            console.log(`Receive status for pid ${req.params.pid}`);
            res.json({ test: true });
        } catch (err) {
            next(err);
        }
    }
}