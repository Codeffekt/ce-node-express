import { AccountSettings, FormRoot } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { AccountsService } from "./AccountsService";
import { AuthService } from "./AuthService";
import { ContextService } from "./ContextService";
import { DbConfigService } from "./DbConfigService";
import { FormsService } from "./FormsService";
import { Roots } from "../core/Roots";

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

    @Inject(FormsService)
    private readonly formsService: FormsService;

    constructor() { }

    async init(config: InitConfig = INIT_CONFIG) {
        await this.dbConfigService.initTables();
        if (config.clearTables) {
            await this.dbConfigService.clearTables();
        }
        await this.insertFormsRoot();
        await this.insertDefaultAccount(config);
    }

    private async insertFormsRoot() {
        const roots = Roots.forms.map<FormRoot>(root => ({
            ...root,
            ctime: Date.now()
        }));

        for (const root of roots) {
            await this.formsService.upsertFormRoot(root);
        }
    }

    private async insertDefaultAccount(config: InitConfig) {

        const defaultAdminConfig = config.defaultAccount;

        const existingAccount = await this.accountsService.getAccountFromLogin(defaultAdminConfig.login);

        console.log(existingAccount);

        if(existingAccount) {
            return;
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

        await this.accountsService.addAccount(defaultAdmin);
    }

}