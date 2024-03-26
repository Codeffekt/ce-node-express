import { IndexType } from "@codeffekt/ce-core-data";
import { CeService, Inject } from "../core/CeService";
import {
    CeApiAccountId, CeApiBinds,
    CeApiCall, CeApiComponent
} from "../express-router/ApiModule";
import { ProcessingService } from "../services/ProcessingService";
import { AccountsService } from "../services/AccountsService";

@CeApiComponent()
export class PublicProcessing {

    /* @Inject(ProcessingService)
    private readonly processingService: ProcessingService; */

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor() { }

    @CeApiCall
    @CeApiBinds
    async start(@CeApiAccountId id: IndexType, pid: IndexType) {
        const curAccount = await this.accountsService.getAccountFromId(id);
        const processingService = CeService.get(ProcessingService);
        const res = await processingService.start(pid, curAccount);
        return res;
    }

    @CeApiCall
    @CeApiBinds
    async cancel(@CeApiAccountId id: IndexType, pid: IndexType) {
        const curAccount = await this.accountsService.getAccountFromId(id);
        return CeService.get(ProcessingService).cancel(pid, curAccount);
    }

    @CeApiCall
    @CeApiBinds
    async status(@CeApiAccountId id: IndexType, pid: IndexType) {
        const curAccount = await this.accountsService.getAccountFromId(id);
        return CeService.get(ProcessingService).status(pid, curAccount);
    }
}