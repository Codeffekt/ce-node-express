import { SSEEventClient } from "./SSEEventClient";
import { Inject } from "../core/CeService";
import { Response, NextFunction } from "express";
import { FormsService, FormsUpdateEvent } from "../services/FormsService";
import { takeWhile } from "rxjs/operators";
import { FormEvent } from "@codeffekt/ce-core-data";
import { JwtUserRequest } from "../core/Auth";

export class FormUpdateEventClient {

    @Inject(FormsService)
    private formsService: FormsService;    

    private constructor(private sseClient: SSEEventClient) {
        this.sendInitialWelcomeData();
        this.listenToEvents();
    }

    static fromRequest(req: JwtUserRequest, res: Response, next: NextFunction): FormUpdateEventClient {
        const builder = new FormUpdateEventClient(new SSEEventClient({
            req, res, next
        }));
        return builder;
    }

    private sendInitialWelcomeData() {
        this.sseClient.sendData({ type: 'init', data: 'Hello World' });
    }

    private listenToEvents() {
        this.formsService.formUpdate$.pipe(
            takeWhile(() => this.sseClient.isActive()),
        ).subscribe(event => {
            this.sseClient.sendData({
                type: 'message',
                data: JSON.stringify(this.createFormEvent(event))
            });            
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