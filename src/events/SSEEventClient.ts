import { interval } from "rxjs";
import { JwtUserRequest } from "../core/Auth";
import { Request, Response } from "express";
import { NextFunction } from "express";
import { takeWhile } from "rxjs/operators";

const KEEP_ALIVE_INTERVAL = 30000; // 30s

export interface EventData {
    type: string;
    data: string;
}

export interface SSEEventClientConfig {
    req: JwtUserRequest | Request;
    res: Response;
    next: NextFunction;    
}

export class SSEEventClient {

    private keepAlive$ = interval(KEEP_ALIVE_INTERVAL);

    private active = false;

    constructor(
        private config: SSEEventClientConfig) {
        this.active = true;
        this.writeInitialHeader();
        this.handleClose();
        this.sendKeepAlive();
    }

    sendData(evt: EventData) {
        const data = `data: ${evt.data}\n\n`;
        this.config.res.write(`event: ${evt.type}\n`);
        this.config.res.write(data);
    }

    isActive() {
        return this.active;
    }

    private writeInitialHeader() {
        const headers = {
            'Content-Type': 'text/event-stream',
            // do no apply compression middleware
            // see https://expressjs.com/en/resources/middleware/compression.html   
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        };
        this.config.res.writeHead(200, headers);
    }

    private handleClose() {
        this.config.req.on('close', () => {
            this.active = false;
        });
    }

    private sendKeepAlive() {
        this.keepAlive$.pipe(
            takeWhile(() => this.active),
        ).subscribe(() => this.sendKeepAliveData());
    }

    private sendKeepAliveData() {
        this.sendData({ type: 'keep_alive', data: 'Hello World' });
    }    
}