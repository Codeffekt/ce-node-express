import { AccountSettings, ROLE_VIEW } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { AccountsService } from "../services/AccountsService";
import { AuthService } from "../services/AuthService";
import { ContextService } from "../services/ContextService";

export class AccountBuilder {

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    @Inject(ContextService)
    private readonly context: ContextService;

    constructor(private creator: AccountSettings) {
    }

    async create(accountInput?: Partial<AccountSettings>) {

        const core = this.context.createCore();

        const newAccount = {
            login: "",
            passwd: "",
            firstName: "",
            lastName: "",
            email: "",
            lang: "",
            role: ROLE_VIEW,
            authz: {},
            projects: [],
            rooms: [],
            key: this.creator.key,
            account: this.creator.account,
            ...core,
            ...accountInput,            
        } as AccountSettings;

        if (newAccount.passwd !== undefined) {
            newAccount.passwd = await AuthService.createHash(newAccount.passwd);
        }

        return AuthService.filterAccountSettings(
            await this.accountsService.addAccount(newAccount)
        );
    }

}