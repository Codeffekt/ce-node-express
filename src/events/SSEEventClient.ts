import { interval, Subscription } from "rxjs";
import { JwtUserRequest } from "../core/Auth";
import { Request, Response } from "express";
import { NextFunction } from "express";
import { Inject } from "../core/CeService";
import { FormsService, FormsUpdateEvent } from "../services/FormsService";
import { FormEvent, FormInstance } from "@codeffekt/ce-core-data";
import { filter, map, takeWhile } from "rxjs/operators";

const KEEP_ALIVE_INTERVAL = 30000; // 30s

export type EventPredicate = (evt: FormInstance) => boolean;
export type EventFilter = (evt: FormsUpdateEvent) => FormsUpdateEvent;

export interface SSEEventClientConfig {
    req: JwtUserRequest | Request;
    res: Response;
    next: NextFunction;    
    predicate?: EventPredicate;
    retrieveFormContent?: boolean;
}

export class SSEEventClient {    

    @Inject(FormsService)
    private formsService: FormsService;

    private subscription: Subscription = new Subscription();

    private keepAlive$ = interval(KEEP_ALIVE_INTERVAL);

    private isActive = false;

    constructor(
        private config: SSEEventClientConfig) {
            this.isActive = true;
            this.writeInitialHeader();
            this.handleClose();
            this.sendInitialWelcomeData();
            this.listenToEvents(this.config.predicate);
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
        this.config.res.writeHead(200, headers);
    }

    private handleClose() {
        this.config.req.on('close', () => {            
            console.log("SSEEVENTCLIENT CLOSE");
            this.isActive = false;            
            this.subscription.unsubscribe();
        });
    }

    private sendInitialWelcomeData() {        
        const data = 'data: Hello World!\n\n';
        this.config.res.write(`event: init\n`);
        this.config.res.write(data);
    }

    private sendKeepAlive() {
        this.keepAlive$.pipe(
            takeWhile(() => this.isActive),
        ).subscribe(() => this.sendInitialWelcomeData());
    }    

    private listenToEvents(predicate?: EventPredicate) {
        this.subscription = this.formsService.formUpdate$.pipe(
            takeWhile(() => this.isActive),
            map(evt => predicate ? ({
                ...evt,
                elts: evt.elts.filter(elt => predicate(elt)),                
            }) : evt),
            filter(evt => evt.elts.length > 0),
        ).subscribe(event => {            
            const data = `data: ${JSON.stringify(this.createFormEvent(event))}\n\n`;
            console.log("SSEEVENTCLIENT", data);
            this.config.res.write(`event: message\n`);
            this.config.res.write(data);            
        });
    }

    private createFormEvent(updateEvent: FormsUpdateEvent): FormEvent {
        return {
            author: updateEvent.author,
            elts: this.config.retrieveFormContent ? updateEvent.elts : updateEvent.elts.map(elt => elt.id),
            type: 'update',
            time: Date.now()
        };
    }
}