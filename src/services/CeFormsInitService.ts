import { AccountSettings } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { AccountsService } from "./AccountsService";
import { AuthService } from "./AuthService";
import { ContextService } from "./ContextService";
import { DbConfigService } from "./DbConfigService";

export interface InitUserConfig {
    login: string;
    passwd: string;
    account: string;
}

export interface InitConfig {
    superAdmin: InitUserConfig;
    defaultAccount: InitUserConfig;
}

const INIT_CONFIG: InitConfig = {
    superAdmin: {
        login: "admin",
        passwd: "admin",
        account: "admin"
    },
    defaultAccount: {
        login: "admin-default",
        passwd: "admin",
        account: "dedault"
    }
};

@Service()
export class CeFormsInitService {

    @Inject(ContextService)
    private readonly context: ContextService;

    @Inject(DbConfigService)
    private readonly dbConfigService: DbConfigService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor() { }

    async init(config: InitConfig = INIT_CONFIG) {
        await this.dbConfigService.initTables();
        await this.dbConfigService.clearTables();
        await this.insertSuperAdminUser(config);
        await this.insertDefaultAccount(config);
    }

    private async insertSuperAdminUser(config: InitConfig) {

        const superAdminConfig = config.superAdmin;        

        const hashPasswd = await AuthService.createHash(superAdminConfig.passwd);

        const superAdmin: AccountSettings = {
            ...this.context.createCore(),
            key: this.context.createUnique(),
            account: superAdminConfig.account,
            login: superAdminConfig.login,
            passwd: hashPasswd,
            firstName: undefined,
            lastName: undefined,
            email: undefined,
            lang: undefined,
            role: "admin",
            projects: []
        };

        await this.accountsService.addAccount(superAdmin);
    }

    private async insertDefaultAccount(config: InitConfig) {
        
        const superAdmin = await this.accountsService.getAccountFromLogin(config.superAdmin.login);

        const defaultAdminConfig = config.defaultAccount;        

        const hashPasswd = await AuthService.createHash(defaultAdminConfig.passwd);

        const defaultAdmin: AccountSettings = {
            ...this.context.createCore(),
            key: superAdmin.key,
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