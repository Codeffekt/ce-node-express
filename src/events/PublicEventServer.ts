import { Inject } from "../core/CeService";
import { API_ANSWER_OK, CeApiComponent } from "../express-router/ApiModule";
import { CeEventClient, EventMessage } from "../servers/CeEventClient";


@CeApiComponent()
export class PublicEvent {

    @Inject(CeEventClient)
    private readonly eventService: CeEventClient;

    constructor() { }

    send(m: EventMessage) {
        this.eventService.send(m);
        return API_ANSWER_OK;
    }
}