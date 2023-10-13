import { AccountSettings, IndexType } from "@codeffekt/ce-core-data";
import { connect, Socket } from "socket.io-client";
import { ContextService } from "../services/ContextService";
import { Inject, Service } from "../core/CeService";
import { CeEvent, CeEventFwd, ROOM_RECEPTIONIST } from "@codeffekt/ce-events-data";
import { ReplaySubject } from "rxjs";

export type OnMessageCallback = Function;

export interface CeEventClientParams {
  url: string;
  token: string;
  room: string;
  onMessage?: OnMessageCallback;
}
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

  formEvent$: ReplaySubject<CeEvent> = new ReplaySubject();

  public static readonly CE_EVENT_MSG = "cevt";
  public static readonly CE_EVENT_MSG_FWD = "cevt.fwd";
  public static readonly FAKEDB_MSG = "message";
  public static readonly MAX_STR_DISP = 512;

  private socket: Socket;

  private isConnected = false;

  private params: CeEventClientParams;

  constructor() {

  }

  setConfig(config: CeEventClientParams) {
    this.params = config;
  }

  connect() {    

    this.socket = connect(this.params.url, { query: { auth_token: this.params.token } });

    this.socket.on('error', (err: any) => {
      console.log('[CeEventClient] error');
      throw new Error(err);
    });

    this.socket.on("connect", () => {
      console.log('[CeEventClient] connection done');
      this.isConnected = true;
    });

    this.socket.on("connect_timeout", (data: any) => {
      console.log('[CeEventClient] connection timeout');
      this.isConnected = false;
    });

    this.socket.on("connect_error", (data: any) => {
      if (this.isConnected) { // only log the first connection error
        console.log('[CeEventClient] connection error');
        this.isConnected = false;
      }
    });

    this.socket.on("reconnect", (data: any) => {
      console.log('[CeEventClient] re-connection done');
      this.isConnected = true;
    });

    this.socket.on(CeEventClient.FAKEDB_MSG, (data: any) => {
      console.log(`[CeEventClient] recv ${JSON.stringify(data)}`);
      if(this.params.onMessage) {
        this.params.onMessage(data);
      }
    });
  }

  send(m: EventMessage) {
    console.log(`[CeEventClient] send ${JSON.stringify(m)}`);
    this.socket.emit(CeEventClient.FAKEDB_MSG, m);
  }

  fwd(m: EventMessage, account: AccountSettings) {

    const event = this.createFwdFromMessage(m, account);

    this.context.logInfo(JSON.stringify(event, null, 2), CeEventClient.MAX_STR_DISP);

    if (this.isConnected) {
      this.socket.emit(CeEventClient.CE_EVENT_MSG_FWD, event);
    }

    this.formEvent$.next(event.event);
  }

  private createFwdFromMessage(m: EventMessage, account: AccountSettings): CeEventFwd {
    const roomId = this.params?.room ?? ROOM_RECEPTIONIST;
    return {
      event: {
        uuid: m.id,
        who: {
          account: account.login,
        },
        where: {
          room: roomId
        },
        what: {
          payload: m
        },
        when: {
          timestamp: Date.now()
        },
        why: {
          type: m.type
        }
      }
    }
  };
}
