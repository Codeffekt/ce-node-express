import { Response } from "express";
import { NextFunction } from "express";
import { Service } from "../core/CeService";
import { Controller, Get } from "../express-router/ExpressRouter";
import { JwtUserRequest } from "../core/Auth";
import { SSEEventClient } from "../events/SSEEventClient";

@Service()
@Controller({ path: '/events/' })
export class EventsApiServer {

    constructor() {
    }

    @Get({ path: '/all' })
    getEvents(req: JwtUserRequest, res: Response, next: NextFunction) {
        new SSEEventClient(req, res, next);
    }
}