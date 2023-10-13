import { Subscription } from "rxjs";
import { CeEventClient } from "../servers/CeEventClient";
import { CeService, Inject, Service } from "../core/CeService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { ContextService } from "./ContextService";
import { CeEvent, CeEventWhat, CeEventWhen, CeEventWhere, CeEventWho, CeEventWhy } from "@codeffekt/ce-events-data";
import { FormBlockEntity, FormInstance, FormRootEntity, IndexType } from "@codeffekt/ce-core-data";
import { FormsService } from "./FormsService";
import * as format from "pg-format";

const FORM_CE_EVENT = "form-ce-event";

@FormRootEntity({ id: CeEventEntity.ROOT, title: "Form Ce-Event", table: "ce-event"})
export class CeEventEntity {

    static readonly ROOT = "form-ce-event";

    @FormBlockEntity({ type: 'index'})
    uuid: IndexType;

    @FormBlockEntity({ type: 'object'})
    who: CeEventWho;

    @FormBlockEntity({ type: 'object'})
    where: CeEventWhere;

    @FormBlockEntity({ type: 'object'})
    what: CeEventWhat;

    @FormBlockEntity({ type: 'object'})
    why: CeEventWhy;

    @FormBlockEntity({ type: 'object'})
    when: CeEventWhen;
}

@Service()
export class FormsEventsService {

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    @Inject(ContextService)
    private readonly context: ContextService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private subscription: Subscription;

    constructor() {}

    listenToCeEventClient() {
        this.disconnectFromCeEventClient();

        this.subscription = CeService.get(CeEventClient)
            .formEvent$
            .subscribe((evt) => {
                this.context.logInfo(`[FormsEvents] receive event ${evt}`);
                this.insertEvents([evt]);
            });

        this.context.logInfo("[FormsEvents] Listen to ce event client");
    }

    disconnectFromCeEventClient() {
        if(this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = undefined;
        }
    }

    async insertEvents(evts: CeEvent[]) {
        return this.insertForms(evts.map(evt => this.createFormFromEvent(evt)));
    }    

    private async insertForms(elts: FormInstance[]): Promise<boolean> {
        const query = format(`insert into forms_event(data) values %L on conflict((data->>'id')) do update set data=excluded.data`, elts.map(elt => [elt]));
        await this.db.poolProject.query(query);
        return true;
    }

    private createFormFromEvent(evt: CeEvent): FormInstance {        
        const entity = new CeEventEntity();
        entity.uuid = evt.uuid;
        entity.who = evt.who;
        entity.what = evt.what;
        entity.when = evt.when;
        entity.where = evt.where;
        entity.why = evt.why;
        return this.formsService.createFormFromEntity(entity, evt.uuid);
    }
}