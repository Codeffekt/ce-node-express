import { AccountSettings } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import {
    DB_TABLE_ACCOUNTS, DB_TABLE_ASSETS,
    DB_TABLE_FORMS, DB_TABLE_FORMSROOT,
    DB_TABLE_FORMS_ADMIN, DB_TABLE_FORMS_ASSOC,
    DB_TABLE_FORMS_EVENT, DB_TABLE_FORMS_TOKEN,
    DB_TABLE_FORMS_VERSION, DB_TABLE_PROJECTS
} from "../core/Db";
import { DatabaseServer } from "../servers/DatabaseServer";
import { AuthService } from "./AuthService";
import { ContextService } from "./ContextService";

export interface DbConfigConfig {
    dbName: string;
    userName: string;
    password: string;
}

export interface InitTableUserConfig {
    login: string;
    passwd: string;
    account: string;
}

export interface InitTableConfig {
    superAdmin: InitTableUserConfig;
    defaultAccount: InitTableUserConfig;
}

const INIT_TABLE_CONFIG: InitTableConfig = {
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
export class DbConfigService {

    private config: DbConfigConfig = {
        dbName: "formenv",
        userName: "formenv",
        password: "formenv"
    };

    @Inject(ContextService)
    private readonly context: ContextService;

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    constructor() {
    }

    setConfig(config: DbConfigConfig) {
        this.config = config;
    }

    async initDatabase() {

        const haveDatabase = await this.checkDatabase(this.config.dbName);

        if (!haveDatabase) {
            this.context.logInfo(`Missing db ${this.config.dbName}, create it`);
            await this.createDatabase(this.config.dbName);
        }

        const haveUser = await this.checkUser(this.config.userName);

        if (!haveUser) {
            this.context.logInfo(`Missing user ${this.config.userName}, create it`);
            await this.createUser(this.config.userName, this.config.password);
        }

        this.context.logInfo(`Grant privileges to ${this.config.userName} on ${this.config.dbName}`);
        await this.grantUserPrivileges(this.config.userName, this.config.dbName);
    }

    async initTables(config: InitTableConfig = INIT_TABLE_CONFIG) {
        await this.createUpdateNotifyFunc();
        await this.createMergeRecursiveFunc();
        await this.createTableAccounts();
        await this.createTableAssets();
        await this.createTableForms();
        await this.createTableFormsAdmin();
        await this.createTableFormsRoot();
        await this.createTableFormsAssoc();
        await this.createTableFormsVersion();
        await this.createTableFormsToken();
        await this.createTableFormsEvent();
        await this.createTableProjects();
        await this.insertSuperAdminUser(config);
        await this.insertDefaultAccount(config);
    }

    async clearDatabase() {
        await this.db.poolProject.query(`drop database if exists ${this.config.dbName}`);
        await this.db.poolProject.query(`drop user if exists ${this.config.userName}`);
    }

    private async clearTable(dbName: string) {
        await this.db.poolProject.query(`delete from ${dbName}`);
    }

    private async checkDatabase(dbName: string) {
        const res = await this.db.poolProject.query(`select * from pg_database where datname='${dbName}'`);
        return res.rowCount > 0;
    }

    private async checkUser(userName: string) {
        const res = await this.db.poolProject.query(`select * from pg_user where usename='${userName}'`);
        return res.rowCount > 0;
    }

    private async checkTable(tableName: string) {
        const res = await this.db.poolProject.query(`SELECT * FROM information_schema.tables where table_schema='public' and table_name='${tableName}'`);
        return res.rowCount > 0;
    }

    private async createDatabase(dbName: string) {
        await this.db.poolProject.query(`create database ${dbName}`);
    }

    private async createUser(userName: string, password: string) {
        await this.db.poolProject.query(`create user ${userName} with password '${password}'`);
    }

    private async grantUserPrivileges(userName: string, dbName: string) {
        await this.db.poolProject.query(`grant all privileges on database ${dbName} to ${userName}`);
    }

    private async createTableAccounts() {

        const haveTable = await this.checkTable(DB_TABLE_ACCOUNTS);

        if (haveTable) {
            return;
        }

        await this.doTransaction([
            `create table ${DB_TABLE_ACCOUNTS}(id serial not null primary key, data jsonb not null)`,
            `create index ${DB_TABLE_ACCOUNTS}_account on ${DB_TABLE_ACCOUNTS} using btree((data->>'account'))`,
            `create unique index ${DB_TABLE_ACCOUNTS}_login on ${DB_TABLE_ACCOUNTS} using btree((data->>'login'))`
        ]);

        await this.createTriggers(DB_TABLE_ACCOUNTS);
    }

    private async createTableAssets() {
        const haveTable = await this.checkTable(DB_TABLE_ASSETS);

        if (haveTable) {
            return;
        }

        await this.doTransaction([
            `create table ${DB_TABLE_ASSETS}(id serial not null primary key, ref text not null, data jsonb not null)`,
            `create unique index ${DB_TABLE_ASSETS}_id on ${DB_TABLE_ASSETS} using btree((data->>'id'))`,
            `create index ${DB_TABLE_ASSETS}_ref on ${DB_TABLE_ASSETS} using btree(ref)`,
            `create index ${DB_TABLE_ASSETS}_ctime on ${DB_TABLE_ASSETS} using btree((data->>'ctime'))`
        ]);
    }

    private async createTableFormsRoot() {
        const haveTable = await this.checkTable(DB_TABLE_FORMSROOT);

        if (haveTable) {
            return;
        }

        await this.doTransaction(this.getCreateFormTableTransaction(DB_TABLE_FORMSROOT));

        await this.createTriggers(DB_TABLE_FORMSROOT);
    }

    private getCreateFormTableTransaction(tableName: string): string[] {
        return [
            `CREATE TABLE ${tableName} (id serial not null primary key, data jsonb not null)`,
            `create unique index ${tableName}_id on ${tableName} using btree((data->>'id'))`,
        ];
    }

    private async createTableFormsFromName(tableName: string): Promise<boolean> {
        const haveTable = await this.checkTable(tableName);

        if (haveTable) {
            return false;
        }

        await this.doTransaction([
            ...this.getCreateFormTableTransaction(tableName),
            `create index ${tableName}_root on ${tableName} using btree((data->>'root'))`,
            `create index ${tableName}_ctime on ${tableName} using btree((data->>'ctime'))`
        ]);

        return true;
    }

    private async createTableForms() {
        await this.createTableFormsFromName(DB_TABLE_FORMS);
    }

    private async createTableFormsAdmin() {
        const isCreated = await this.createTableFormsFromName(DB_TABLE_FORMS_ADMIN);
        if (isCreated) {
            await this.createTriggers(DB_TABLE_FORMS_ADMIN);
        }
    }

    private async createTableFormsVersion() {
        const haveTable = await this.checkTable(DB_TABLE_FORMS_VERSION);

        if (haveTable) {
            return;
        }

        await this.doTransaction([
            ...this.getCreateFormTableTransaction(DB_TABLE_FORMS_VERSION),
            `create index ${DB_TABLE_FORMS_VERSION}_head on ${DB_TABLE_FORMS_VERSION} using btree((data->'version'->>'head'))`,
            `create index ${DB_TABLE_FORMS_VERSION}_root on ${DB_TABLE_FORMS_VERSION} using btree((data->>'root'))`,
            `create index ${DB_TABLE_FORMS_VERSION}_ctime on ${DB_TABLE_FORMS_VERSION} using btree((data->>'ctime'))`
        ]);
    }

    private async createTableFormsEvent() {
        const haveTable = await this.checkTable(DB_TABLE_FORMS_EVENT);

        if (haveTable) {
            return;
        }

        await this.doTransaction(this.getCreateFormTableTransaction(DB_TABLE_FORMS_EVENT));
    }

    private async createTableFormsToken() {
        const haveTable = await this.checkTable(DB_TABLE_FORMS_TOKEN);

        if (haveTable) {
            return;
        }

        await this.doTransaction([
            ...this.getCreateFormTableTransaction(DB_TABLE_FORMS_TOKEN),
            `create unique index ${DB_TABLE_FORMS_TOKEN}_author on ${DB_TABLE_FORMS_TOKEN} using btree((data->>'author'))`
        ]);
    }

    private async createTableFormsAssoc() {
        const haveTable = await this.checkTable(DB_TABLE_FORMS_ASSOC);

        if (haveTable) {
            return;
        }

        await this.doTransaction([
            `CREATE TABLE ${DB_TABLE_FORMS_ASSOC} (ref text not null, form text not null, primary key(ref, form))`,
            `create index ${DB_TABLE_FORMS_ASSOC}_ref on ${DB_TABLE_FORMS_ASSOC} using btree(ref)`,
            `create index ${DB_TABLE_FORMS_ASSOC}_form on ${DB_TABLE_FORMS_ASSOC} using btree(form)`
        ]);
    }

    private async createTableProjects() {
        const haveTable = await this.checkTable(DB_TABLE_PROJECTS);

        if (haveTable) {
            return;
        }

        await this.doTransaction([
            `CREATE TABLE ${DB_TABLE_PROJECTS} (id serial not null primary key, data jsonb not null)`,
            `create unique index ${DB_TABLE_PROJECTS}_id on ${DB_TABLE_PROJECTS} using btree((data->>'id'))`
        ]);

        await this.createTriggers(DB_TABLE_PROJECTS);
    }

    private async createUpdateNotifyFunc() {
        const query = `
        CREATE OR REPLACE FUNCTION table_update_notify() RETURNS trigger AS $$
        DECLARE
            id bigint;
            data jsonb;
        BEGIN
            IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
                id = NEW.id;
                data = NEW.data;
            ELSE
                id = OLD.id;
                data = OLD.data;
        END IF;
        PERFORM pg_notify('table_update', json_build_object('table', TG_TABLE_NAME, 'id', id, 'type', TG_OP, 'data', data)::text);
        RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `;
        await this.db.poolProject.query(query);
    }

    private async createMergeRecursiveFunc() {
        const query = `
        create or replace function jsonb_merge_recurse(orig jsonb, delta jsonb) 
        returns jsonb language sql as $$
        select
        jsonb_object_agg(
            coalesce(keyOrig, keyDelta),
            case
                when valOrig isnull then valDelta
                when valDelta isnull then valOrig
                when (jsonb_typeof(valOrig) <> 'object' or jsonb_typeof(valDelta) <> 'object') then valDelta
                else jsonb_merge_recurse(valOrig, valDelta)
            end
        )
        from jsonb_each(orig) e1(keyOrig, valOrig)
        full join jsonb_each(delta) e2(keyDelta, valDelta) on keyOrig = keyDelta
        $$
        `;
        await this.db.poolProject.query(query);
    }

    private async insertSuperAdminUser(config: InitTableConfig) {

        const superAdminConfig = config.superAdmin;

        const res = await this.db.poolProject.query(`select * from ${DB_TABLE_ACCOUNTS} where data->>'account'='${superAdminConfig.account}'`);
        if (res.rowCount > 0) {
            return;
        }

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

        await this.db.poolProject.query(`insert into ${DB_TABLE_ACCOUNTS}(data) values ('${JSON.stringify(superAdmin)}')`);
    }

    private async insertDefaultAccount(config: InitTableConfig) {

        const defaultAdminConfig = config.defaultAccount;

        const res = await this.db.poolProject.query(`select * from ${DB_TABLE_ACCOUNTS} where data->>'account'='${defaultAdminConfig.account}'`);
        if (res.rowCount > 0) {
            return;
        }

        const superAdmin = await this.getSuperAdminAccount(config);

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

        await this.db.poolProject.query(`insert into ${DB_TABLE_ACCOUNTS}(data) values ('${JSON.stringify(defaultAdmin)}')`);
    }

    private async getSuperAdminAccount(config: InitTableConfig) {
        const res = await this.db.poolProject.query(`select data from ${DB_TABLE_ACCOUNTS} where data->>'account'='${config.superAdmin.account}'`);
        if (res.rowCount === 0) {
            throw new Error(`SuperAdmin account not found !`);
        }
        return res.rows[0] as AccountSettings;
    }

    private async createTriggers(tableName: string) {
        await this.createTrigger(tableName, 'insert');
        await this.createTrigger(tableName, 'update');
        await this.createTrigger(tableName, 'delete');
    }

    private async createTrigger(tableName: string, action: 'update' | 'insert' | 'delete') {
        await this.doTransaction([
            `DROP TRIGGER IF EXISTS ${tableName}_notify_${action} ON ${tableName}`,
            `CREATE TRIGGER ${tableName}_notify_${action} AFTER ${action} ON ${tableName} FOR EACH ROW EXECUTE PROCEDURE table_update_notify();`
        ]);
    }

    private async doTransaction(queries: string[]) {

        if (!queries.length) {
            return;
        }

        const client = await this.db.poolProject.connect();
        try {
            await client.query('BEGIN');
            for (const query of queries) {
                await client.query(query);
            }
            await client.query('COMMIT');
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }
}