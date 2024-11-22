import { AccountSettings, FormRoot, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { AccountsService } from "./AccountsService";
import { AuthService } from "./AuthService";
import { ContextService } from "./ContextService";
import { DbConfigService } from "./DbConfigService";
import { Roots } from "../core/Roots";
import { FormsRootService } from "./FormsRootService";

export interface InitUserConfig {
    login: string;
    passwd: string;
    account: string;
}

export interface InitConfig {
    defaultAccount: InitUserConfig;
    clearTables: boolean;
}

const INIT_CONFIG: InitConfig = {
    defaultAccount: {
        login: "admin-default",
        passwd: "admin",
        account: "dedault"
    },
    clearTables: true
};

@Service()
export class CeFormsInitService {

    @Inject(ContextService)
    private readonly context: ContextService;

    @Inject(DbConfigService)
    private readonly dbConfigService: DbConfigService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;    

    @Inject(FormsRootService)
    private readonly formsRootService: FormsRootService;

    constructor() { }

    async init(config: InitConfig = INIT_CONFIG) {
        await this.dbConfigService.initTables();
        if (config.clearTables) {
            await this.dbConfigService.clearTables();
        }
        const defaultAccount = await this.insertDefaultAccount(config);
        await this.insertFormsRoot(defaultAccount.id);
        
    }

    private async insertFormsRoot(author: IndexType) {
        const roots = Roots.forms.map<FormRoot>(root => ({
            ...root,
            ctime: Date.now()
        }));

        for (const root of roots) {
            await this.formsRootService.upsertFormRoot(root, author);
        }
    }

    private async insertDefaultAccount(config: InitConfig): Promise<AccountSettings> {

        const defaultAdminConfig = config.defaultAccount;

        const existingAccount = await this.accountsService.getAccountFromLogin(defaultAdminConfig.login);

        console.log(existingAccount);

        if(existingAccount) {
            return existingAccount;
        }

        const hashPasswd = await AuthService.createHash(defaultAdminConfig.passwd);

        const defaultAdmin: AccountSettings = {
            ...this.context.createCore(),
            key: this.context.createUnique(),
            account: defaultAdminConfig.account,
            login: defaultAdminConfig.login,
            passwd: hashPasswd,
            firstName: undefined,
            lastName: undefined,
            email: undefined,
            lang: undefined,
            role: "admin",
            projects: []
        };

        return this.accountsService.addAccount(defaultAdmin);
    }

}