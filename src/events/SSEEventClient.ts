import { interval, Subscription } from "rxjs";
import { JwtUserRequest } from "../core/Auth";
import { Response } from "express";
import { NextFunction } from "express";
import { Inject } from "../core/CeService";
import { FormsService, FormsUpdateEvent } from "../services/FormsService";
import { FormEvent } from "@codeffekt/ce-core-data";
import { takeWhile } from "rxjs/operators";

const KEEP_ALIVE_INTERVAL = 30000; // 30s

export class SSEEventClient {    

    @Inject(FormsService)
    private formsService: FormsService;

    private subscription: Subscription = new Subscription();

    private keepAlive$ = interval(KEEP_ALIVE_INTERVAL);

    private isActive = false;

    constructor(
        private req: JwtUserRequest,
        private res: Response,
        private next: NextFunction) {
            this.isActive = true;
            this.writeInitialHeader();
            this.handleClose();
            this.sendInitialWelcomeData();
            this.listenToEvents();
            this.sendKeepAlive();
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
        this.res.writeHead(200, headers);
    }

    private handleClose() {
        this.req.on('close', () => {            
            console.log("SSEEVENTCLIENT CLOSE");
            this.isActive = false;            
            this.subscription.unsubscribe();
        });
    }

    private sendInitialWelcomeData() {        
        const data = 'data: Hello World!\n\n';
        this.res.write(`event: init\n`);
        this.res.write(data);
    }

    private sendKeepAlive() {
        this.keepAlive$.pipe(
            takeWhile(() => this.isActive),
        ).subscribe(() => this.sendInitialWelcomeData());
    }    

    private listenToEvents() {
        this.subscription = this.formsService.formUpdate$.pipe(
            takeWhile(() => this.isActive),
        ).subscribe(event => {            
            const data = `data: ${JSON.stringify(this.createFormEvent(event))}\n\n`;
            console.log("SSEEVENTCLIENT", data);
            this.res.write(`event: message\n`);
            this.res.write(data);            
        });
    }

    private createFormEvent(updateEvent: FormsUpdateEvent): FormEvent {
        return {
            author: updateEvent.author,
            elts: updateEvent.elts.map(elt => elt.id),
            type: 'update',
            time: Date.now()
        };
    }
}