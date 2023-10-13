import { AccountBuilder } from "./AccountBuilder";
import { AccountSettings } from "@codeffekt/ce-core-data";
import { AccountsService } from "../services/AccountsService";
import { Inject } from "../core/CeService";
import { AuthService } from "../services/AuthService";

export class AccountUpsertFacade {

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor(private creator: AccountSettings) {
    }

    async execute(accountInput: Partial<AccountSettings>) {
        const existingAccount = await this.accountsService.getAccountFromId(accountInput.id);
        if (!existingAccount) {            
            const builder = new AccountBuilder(this.creator);
            return builder.create(accountInput);
        }

        if (accountInput.passwd !== undefined) {
            accountInput.passwd = await AuthService.createHash(accountInput.passwd);
        }

        return AuthService.filterAccountSettings(await this.accountsService.updateAccount({
            key: this.creator.key,            
            ...existingAccount,
            ...accountInput,
            id: existingAccount.id,
            ctime: existingAccount.ctime,
        }, this.creator.id));
    }
}
