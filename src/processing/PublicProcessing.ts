import { IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import {
    CeApiAccountId, CeApiBinds,
    CeApiCall, CeApiComponent
} from "../express-router/ApiModule";
import { ProcessingService } from "../services/ProcessingService";
import { AccountsService } from "../services/AccountsService";

@CeApiComponent()
export class PublicProcessing {

    @Inject(ProcessingService)
    private readonly processingService: ProcessingService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor() { }

    @CeApiCall
    @CeApiBinds
    async start(@CeApiAccountId id: IndexType, pid: IndexType) {
        const curAccount = await this.accountsService.getAccountFromId(id);
        return this.processingService.start(pid, curAccount);
    }

    @CeApiCall
    @CeApiBinds
    async cancel(pid: IndexType) {
        return this.processingService.cancel(pid);
    }

    @CeApiCall
    @CeApiBinds
    async status(pid: IndexType) {
        return this.processingService.status(pid);
    }
}