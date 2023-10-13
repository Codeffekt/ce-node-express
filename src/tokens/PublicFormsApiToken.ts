import { FormsApiTokensService } from "../services/FormsApiTokensService";
import { Inject } from "../core/CeService";
import { CeApiAdmin, CeApiCall, CeApiComponent } from "../express-router/ApiModule";
import { FormQuery, IndexType } from "@codeffekt/ce-core-data";

@CeApiComponent()
export class PublicFormsApiToken {

    @Inject(FormsApiTokensService)
    private readonly tokensService: FormsApiTokensService;

    @CeApiCall
    @CeApiAdmin
    getFormsQuery(query: FormQuery) {
        return this.tokensService.getFormsQuery({ limit: 0, offset: 0, ...query });
    }

    @CeApiCall
    async deleteFormsQuery(query: FormQuery): Promise<boolean> {
      return this.tokensService.deleteFormsQuery(query);
    }

    @CeApiCall
    @CeApiAdmin
    generateToken(account: IndexType, expirationTime?: number) {
        return this.tokensService.generateToken(account, expirationTime);
    }
}