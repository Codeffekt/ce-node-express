import { APIError, APIRouteError, API_STATUS_UNKNOWN } from "@codeffekt/ce-core-data";
import { NextFunction, Response, Request } from "express";
import { Service } from "../core/CeService";
import { AppUse, Controller, Use } from "../express-router/ExpressRouter";
@Service()
@Controller({ path: '/' })
export class ErrorServer {   

    constructor(
    ) {        
    }            

    @Use()
    routeError(req: Request, res: Response, next: NextFunction) {
        next(new APIRouteError("Invalid route"));
    }

    @AppUse()
    errorHandler(err: APIError|any, req: Request, res: Response, next: NextFunction) {

        if(err instanceof APIError) {
            res.status(err.returnStatus);
            res.json(err.toAPIStatusError());
            return;
        }

        if(err instanceof Error) {
            res.status(500);
            res.json({
                status: {
                    code: API_STATUS_UNKNOWN
                },
                error: {
                    message: err.message,
                    data: undefined,
                }
            });
            return;
        }        

        if (err && err.status) {
            res.status(err.status);
            res.json(err);
            return;
        }

        if (res.headersSent) {
            return next(err);
        }

        res.status(500);

        if (err instanceof Object) {
            console.error(err);
        }

        res.json(err);
    }    
}