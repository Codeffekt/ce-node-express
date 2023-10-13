import { AccountSettings, DbArrayRes, FormQuery, IndexType } from "@codeffekt/ce-core-data";
import * as format from "pg-format";
import { ReplaySubject } from "rxjs";
import { filter } from "rxjs/operators";
import { FormAccountBuilder } from "../account/FormAccountBuilder";
import { Inject, Service } from "../core/CeService";
import { DB_TABLE_ACCOUNTS, DB_TABLE_FORMS, DB_TABLE_FORMSROOT, DB_TABLE_FORMS_ASSOC } from "../core/Db";
import { DatabaseServer, isAccountsUpdate } from "../servers/DatabaseServer";
import { FormsQueryProcess } from "./FormsQueryProcess";
import { FormsService } from "./FormsService";

export interface AccountUpdateEvent {
    elts: AccountSettings[];
    author: IndexType;
}

@Service()
export class AccountsService {

    accountUpdate$: ReplaySubject<AccountUpdateEvent> = new ReplaySubject();

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    constructor() {
    }

    onAccountsChanged() {
        return this.db.tableUpdate$.pipe(
            filter(isAccountsUpdate)
        );
    }

    async getAccountsFormQuery(query: FormQuery): Promise<DbArrayRes<AccountSettings>> {

        const queryProcess = new FormsQueryProcess();
        const res = queryProcess.execute({ ...query, extMode: false }, 
                { 
                    formsTableName: DB_TABLE_FORMS, 
                    formsRootTableName: DB_TABLE_FORMSROOT,
                    assocsTableName: DB_TABLE_FORMS_ASSOC,
                    accountsTableName: DB_TABLE_ACCOUNTS,
                    rootTableName: DB_TABLE_ACCOUNTS,
                });

        return {
            total: 0,
            elts: [],
            limit: 0,
            offset: 0            
        };
    }

    async getAccountFromLogin(login: string): Promise<AccountSettings> {
        const accounts = await this.db.getCachedAccounts();
        return accounts.find(account => account.login === login && this.isAccountValid(account));
    }

    async getAccountFromId(id: IndexType): Promise<AccountSettings> {
        const accounts = await this.db.getCachedAccounts();
        return accounts.find(account => account.id === id);
    }

    isAccountValid(account: AccountSettings): boolean {
        return !account.isDisabled || !account.exp || account.exp > Date.now();
    }

    getAccounts() {
        return this.db.getCachedAccounts();
    }

    async updateAccount(account: AccountSettings, author: IndexType): Promise<AccountSettings> {

        const formAccount = FormAccountBuilder.fromAccount(account, author);
        await this.formsService.updateForm(formAccount.core, author);

        this.db.clearCachedAccounts();
        const query = `update accounts set data='${JSON.stringify(account)}' where data->>'id'='${account.id}'`;
        await this.db.poolProject.query(query);
        this.accountUpdate$.next({ elts: [account], author });
        return account;
    }

    async upsertAccounts(accounts: AccountSettings[], author: IndexType): Promise<boolean> {

        if(!accounts.length) {
            return true;
        }

        const formsAccount = accounts.map(account => FormAccountBuilder.fromAccount(account, author).core);
        await this.formsService.insertForms(formsAccount, author);

        const query = format(`insert into accounts(data) values %L on conflict((data->>'login')) do update set data=excluded.data`,
            accounts.map(elt => [elt]));
        await this.db.poolProject.query(query);
        this.accountUpdate$.next({ elts: accounts, author });
        return true;
    }

    async addAccount(account: AccountSettings): Promise<AccountSettings> {        

        this.db.clearCachedAccounts();
        const query = `insert into accounts(data) values('${JSON.stringify(account)}')`;
        await this.db.poolProject.query(query);

        const formAccount = FormAccountBuilder.fromAccount(account, account.id);
        await this.formsService.insertForm(formAccount.core, account.id);

        return account;
    }

    async deleteAccount(id: IndexType): Promise<boolean> {

        await this.formsService.deleteForms([id]);

        this.db.clearCachedAccounts();
        await this.db.poolProject.query("delete from accounts where data->>'id'=$1", [id]);
        return true;
    }

    getUsers(aid: IndexType, limit: number, offset: number): Promise<AccountSettings[]> {
        return this.db.getCachedAccounts().then(accounts => {
            const filter = accounts.filter(_ => _.account === aid);
            return !limit ? filter.slice(offset) : filter.slice(offset, offset + limit);
        });
    }

    getUsersCount(aid: IndexType): Promise<number> {
        return this.db.getCachedAccounts()
            .then(accounts => accounts.filter(_ => _.account === aid))
            .then(accounts => accounts.length);
    }
}
