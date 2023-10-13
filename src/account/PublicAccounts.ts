
import { AccountBuilder } from "./AccountBuilder";
import { IndexType, AccountSettings, UnauthorizedError, FormInstance } from "@codeffekt/ce-core-data";
import { CeApiAccountId, CeApiAdmin, CeApiBinds, CeApiCall, CeApiComponent, CeApiSuperAdmin } from "../express-router/ApiModule";
import { Inject } from "../core/CeService";
import { AccountsService } from "../services/AccountsService";
import { ProjectsService } from "../services/ProjectsService";
import { AuthService } from "../services/AuthService";
import { OldProject } from "../core/OldProject";

@CeApiComponent()
export class PublicAccounts {

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    constructor() { }

    @CeApiCall
    @CeApiBinds
    async getProjects(@CeApiAccountId id?: IndexType, type?: string): Promise<OldProject[]> {
        const account = await this.accountsService.getAccountFromId(id);
        const projects = await this.projectsService.getProjects();
        return type ? projects
            .filter(project => project.type === type)
            .filter(project => account.projects.indexOf(project.id) !== -1) :
            projects.filter(project => account.projects.indexOf(project.id) !== -1);
    }

    @CeApiCall
    @CeApiBinds
    async getProject(@CeApiAccountId id: IndexType, pid: IndexType): Promise<FormInstance> {
        const account = await this.accountsService.getAccountFromId(id);

        if (account.projects.indexOf(pid) === -1) {
            throw new UnauthorizedError(`Invalid access to project ${pid}`, { id, pid });
        }
        
        return this.projectsService.getProject(pid)
    }

    @CeApiCall
    @CeApiBinds
    getRooms(@CeApiAccountId id?: IndexType): Promise<IndexType[]> {
        return this.accountsService.getAccountFromId(id)
            .then(account => account.rooms);
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async remove(accountId: IndexType, @CeApiAccountId id?: IndexType) {
        const actor = await this.accountsService.getAccountFromId(id);
        const destAccount = await this.accountsService.getAccountFromId(accountId);
        return this.accountsService.deleteAccount(accountId);
    }

    @CeApiCall
    @CeApiBinds
    get(@CeApiAccountId id?: IndexType) {
        return this.accountsService.getAccountFromId(id)
            .then(account => AuthService.filterAccountSettings(account));
    }

    @CeApiCall
    @CeApiBinds
    async getMembers(@CeApiAccountId id?: IndexType): Promise<AccountSettings[]> {
        const adminAccount = await this.accountsService.getAccountFromId(id);
        return (await this.accountsService.getAccounts())
            .filter(account => account.account === adminAccount.account)
            .map(account => AuthService.filterAccountSettings(account));
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async update(@CeApiAccountId id: IndexType, newAccount: AccountSettings) {

        const existingAccount = await this.accountsService.getAccountFromId(newAccount.id);

        const newAccountValues = {
            ...existingAccount,
            role: newAccount.role,
            authz: newAccount.authz,
            mtime: Date.now(),
            projects: newAccount.projects,
            lang: newAccount.lang,
            email: newAccount.email,
            firstName: newAccount.firstName,
            lastName: newAccount.lastName,
            login: newAccount.login
        };

        await this.accountsService.updateAccount(newAccountValues, id);

        return AuthService.filterAccountSettings(newAccountValues);
    }

    @CeApiCall
    @CeApiSuperAdmin
    async getAll(limit: number = 0, offset: number = 0) {
        const accounts = await this.accountsService.getAccounts();
        const accountsPaginated = !limit ? accounts.slice(offset) : accounts.slice(offset, offset + limit);
        return accountsPaginated.map(account => AuthService.filterAccountSettings(account, true));
    }

    @CeApiCall
    @CeApiAdmin
    getAccount(id?: IndexType) {
        return this.accountsService.getAccountFromId(id)
            .then(account => AuthService.filterAccountSettings(account));
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async create(@CeApiAccountId id: IndexType, account?: AccountSettings) {
        const creator = await this.accountsService.getAccountFromId(id);
        const builder = new AccountBuilder(creator);
        return builder.create(account);
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async updatePassword(@CeApiAccountId id: IndexType, uid: IndexType, passwd: string) {
        const account = await this.accountsService.getAccountFromId(uid);
        const hash = await AuthService.createHash(passwd);
        const updatedAccount = await this.accountsService.updateAccount({
            ...account,
            passwd: hash
        }, id);
        return AuthService.filterAccountSettings(updatedAccount);
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async updateAccount(@CeApiAccountId id: IndexType, newAccount: AccountSettings) {
        const account = await this.accountsService.getAccountFromId(newAccount.id);
        if (newAccount.passwd !== undefined) {
            newAccount.passwd = await AuthService.createHash(newAccount.passwd);
        }
        const updatedAccount = await this.accountsService.updateAccount({
            ...account,
            ...newAccount,
            ... {
                id: account.id,
                account: account.account,
                key: account.key,
                ctime: account.ctime
            }
        }, id);
        return AuthService.filterAccountSettings(updatedAccount);
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async updateProjectsAccounts(@CeApiAccountId id: IndexType, pids: IndexType[], aids: IndexType[]) {
        const adminAccount = await this.accountsService.getAccountFromId(id);
        const accounts = (await this.accountsService.getAccounts())
            .filter(account => adminAccount.account === account.account);
        const accountsUpdated = accounts.map(account => ({
            ...account,
            projects: aids.includes(account.id) ?
                [... new Set([...account.projects, ...pids])] :
                account.projects.filter(p => !pids.includes(p))
        }));
        return this.accountsService.upsertAccounts(accountsUpdated, id);
    }

    @CeApiCall
    @CeApiBinds
    async getProjectMembers(@CeApiAccountId id: IndexType, pid: IndexType) {
        const currentAccount = await this.accountsService.getAccountFromId(id);
        if (!currentAccount.projects || !currentAccount.projects.includes(pid)) {
            throw new UnauthorizedError(`Unauthorized project ${pid} for user ${id}`, { id, pid });
        }
        const accounts = (await this.accountsService.getAccounts())
            .filter(account => currentAccount.account === account.account)
            .filter(account => account.projects && account.projects.includes(pid))
            .map(account => AuthService.filterAccountSettings(account, true));
        return accounts;
    }
}

