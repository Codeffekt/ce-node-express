import { AccountSettings, FormQuery, UnauthorizedError, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { AssetsService } from "../services/AssetsService";
import { AuthService } from "../services/AuthService";
import { ProjectsService } from "../services/ProjectsService";

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 10;

export class AssetsQueryFacade {

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(AuthService)
    private readonly authService: AuthService;

    ref: IndexType;

    constructor(private account: AccountSettings) {
    }

    async execute(query: FormQuery) {

        await this.createRef(query);       

        const limit = !query.limit ? DEFAULT_LIMIT : Math.min(query.limit, MAX_LIMIT);

        return this.assetsService.getFormsQuery({ offset: 0, ...query, limit, ref: this.ref });
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