import { AssetElt, CoreIndexElt, DbArrayRes, FormInstance, FormQuery, IndexType, ROLE_CREATE } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import {
    ApiAnswer, API_ANSWER_OK,
    CeApiAccountId, CeApiBinds,
    CeApiCall, CeApiComponent,
    CeApiRole
} from "../express-router/ApiModule";
import { AccountsService } from "../services/AccountsService";
import { ContextService } from "../services/ContextService";
import { AssetsService } from "../services/AssetsService";
import { AssetsDeleteFacade } from "./AssetsDeleteFacade";
import { AssetsQueryFacade } from "./AssetsQueryFacade";
import { BucketCreator } from "./BucketCreator";
@CeApiComponent()
export class PublicAssets {

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    @Inject(ContextService)
    private readonly context: ContextService;

    constructor() { }

    upload(): ApiAnswer {
        return API_ANSWER_OK;
    }

    update(elt: AssetElt) {
        return this.assetsService.updateAsset(elt);
    }

    @CeApiCall
    get(id: IndexType) {
        return this.assetsService.getAsset(id);
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    async createBucket(ref: IndexType, elt: AssetElt) {
        const core: CoreIndexElt = this.context.createCore();
        const asset: AssetElt = {
            metadata: { timestamp: Date.now() as any },
            ...elt,
            ...core,
            ref: ref,
            id: elt.id || core.id
        };

        return this.assetsService.insertAsset(ref, asset);
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    async createBucketAssetsArray(formId: IndexType, field: IndexType, elt: AssetElt) {
        return BucketCreator.fromAssetsArray(formId, field, elt);
    }

    @CeApiCall
    @CeApiBinds
    async getFormsQuery(@CeApiAccountId id: IndexType, query: FormQuery): Promise<DbArrayRes<FormInstance>> {
        const account = await this.accountsService.getAccountFromId(id);        
        return AssetsQueryFacade.fromQuery(account, query);
    }

    @CeApiCall
    @CeApiBinds
    async getAssetsArrayQuery(@CeApiAccountId id: IndexType, formId: IndexType, field: IndexType, query: FormQuery): Promise<DbArrayRes<FormInstance>> {
        const account = await this.accountsService.getAccountFromId(id);        
        return AssetsQueryFacade.fromAssetsArray(account, formId, field, query);
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    @CeApiBinds
    async deleteAssets(@CeApiAccountId id: IndexType, pid: IndexType, assets: IndexType[], deleteFile = true) {
        const account = await this.accountsService.getAccountFromId(id);
        return AssetsDeleteFacade.fromRef(account, assets, pid, deleteFile);        
    }

    @CeApiCall
    @CeApiBinds
    async deleteAssetsArray(@CeApiAccountId id: IndexType, formId: IndexType, field: IndexType, assets: IndexType[], deleteFile = true) {
        const account = await this.accountsService.getAccountFromId(id);
        return AssetsDeleteFacade.fromAssetsArray(account, assets, formId, field, deleteFile);        
    }
}


