import { AccountSettings, IndexType } from "@codeffekt/ce-core-data";
import { ContextService } from "../services/ContextService";
import { Inject, Service } from "../core/CeService";
import { ReplaySubject } from "rxjs";

export type OnMessageCallback = Function;

export interface EventMessage {
  id: IndexType;
  type: string;
  name: string;
  params?: any;
}

@Service()
export class CeEventClient {

  @Inject(ContextService)
  private context: ContextService;

  formEvent$: ReplaySubject<EventMessage> = new ReplaySubject();

  public static readonly CE_EVENT_MSG = "cevt";
  public static readonly CE_EVENT_MSG_FWD = "cevt.fwd";
  public static readonly FAKEDB_MSG = "message";
  public static readonly MAX_STR_DISP = 512;

  constructor() {

  }    

  fwd(m: EventMessage, _: AccountSettings) {    

    this.context.logInfo(JSON.stringify(m, null, 2), CeEventClient.MAX_STR_DISP);    

    this.formEvent$.next(m);
  }
  
}
