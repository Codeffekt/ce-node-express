import { AccountSettings, FormQuery, UnauthorizedError, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { AssetsService } from "../services/AssetsService";
import { AuthService } from "../services/AuthService";
import { AssetsArrayRef } from "./AssetsArrayRef";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

export class AssetsQueryFacade {

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    @Inject(AuthService)
    private readonly authService: AuthService;

    ref: IndexType;

    private constructor(private account: AccountSettings, private query: FormQuery) {
    }

    static fromQuery(account: AccountSettings, query: FormQuery) {
        const builder = new AssetsQueryFacade(account, query);
        return builder.execute();
    }

    static async fromAssetsArray(
        account: AccountSettings,
        formId: IndexType,
        field: IndexType,
        query: FormQuery
    ) {        

        const ref = await AssetsArrayRef.fromAssetsArray(formId, field);

        const builder = new AssetsQueryFacade(account,
            {
                ...query,
                ref: ref.ref,
            });
        return builder.execute();
    }

    private async execute() {

        await this.createRef(this.query);

        const limit = !this.query.limit ? DEFAULT_LIMIT : Math.min(this.query.limit, MAX_LIMIT);

        return this.assetsService.getFormsQuery({ offset: 0, ...this.query, limit, ref: this.ref });
    }

    private async createRef(query: FormQuery) {
        this.ref = undefined;
        if (query.ref) {
            this.ref = query.ref;
        } else if (!this.authService.haveAssetsFullAccess(this.account)) {
            throw new UnauthorizedError('Invalid query for unauthorized user', query);
        }
    }
}