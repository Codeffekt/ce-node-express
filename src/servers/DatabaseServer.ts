import { AccountSettings, FormRoot, IndexType, FormInstanceExt, FormAssoc, FormQuery, DbArrayRes } from "@codeffekt/ce-core-data";
import { Client, Pool, PoolConfig } from "pg";
import { ReplaySubject } from "rxjs";
import { OldProject } from "../core";
import { DbQueryConfigValues, DbQueryResults, DbServer, DbTablesOption } from "../core/Db";
import { Service } from "../core/CeService";
import { SqlDeleteBuilder } from "../forms-sql/SqlDeleteBuilder";
import { SqlInsertBuilder } from "../forms-sql/SqlInsertBuilder";
import { FormsQueryProcess } from "../services/FormsQueryProcess";


export function isProjectsUpdate(u: TableUpdateEvent) {
    return u.table === "projects";
}

export function isFormsRootUpdate(u: TableUpdateEvent) {
    return u.table === "formsroot";
}

export function isFormsUpdate(u: TableUpdateEvent) {
    return u.table === "forms";
}

export function isAccountsUpdate(u: TableUpdateEvent) {
    return u.table === "accounts";
}

export function isFormsAdminUpdate(u: TableUpdateEvent) {
    return u.table === "formsadmin";
}
export interface TableUpdateEvent {
    table: "accounts" | "projects" | "formsroot" | "forms" | "formsadmin";
    id: number;
    type: 'DELETE'|'UPDATE'|'INSERT';
    data: any;
    author?: IndexType;
}

@Service()
export class DatabaseServer implements DbServer {

    private poolProject: Pool;
    tableUpdateClient: Client;

    tableUpdate$: ReplaySubject<TableUpdateEvent> = new ReplaySubject();

    private cachedAccounts: AccountSettings[];
    private cachedProjects: OldProject[];
    private cachedFormsRoot: FormRoot[];
    private cachedFormsAdmin: FormInstanceExt[];

    constructor() {
    }

    async query<T, I = any[]>(q: string, values?: DbQueryConfigValues<I>): Promise<DbQueryResults> {
        return this.poolProject.query<T>(q, values);
    }
    
    async transactions(queries: string[]) {
        if (!queries.length) {
            return;
        }

        const client = await this.poolProject.connect();
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

    async setConfig(configProject: PoolConfig) {        
        await this.close();
        this.poolProject = new Pool(configProject);        
        await this.listenTableUpdate(configProject);        
        return this;
    }

    async close() {
        await this.closeTableUpdate();
        if (this.poolProject) {
            await this.poolProject.end();
            this.poolProject = undefined;
            console.log("End of connection");
        }
        return true;
    }

    clearCachedAccounts() {
        this.cachedAccounts = undefined;
    }

    clearCachedProjects() {
        this.cachedProjects = undefined;
    }

    clearCachedFormsRoot() {
        this.cachedFormsRoot = undefined;
    }

    clearCachedFormsAdmin() {
        this.cachedFormsAdmin = undefined;
    }

    async getCachedAccounts(): Promise<AccountSettings[]> {
        if (!this.cachedAccounts) {
            this.cachedAccounts = await this.query_rows(this.poolProject, "select * from accounts");
        }
        return this.cachedAccounts;
    }


    async getCachedProjects(): Promise<OldProject[]> {
        if (!this.cachedProjects) {
            this.cachedProjects = await this.query_rows(this.poolProject, "select * from projects");
        }
        return this.cachedProjects;
    }

    async getCachedFormsRoot(): Promise<FormRoot[]> {
        if (!this.cachedFormsRoot) {
            this.cachedFormsRoot = await this.query_rows(this.poolProject, "select * from formsroot");
        }
        return this.cachedFormsRoot;
    }    

    async getCachedFormsAdmin(): Promise<FormInstanceExt[]> {
        if (!this.cachedFormsAdmin) {
            this.cachedFormsAdmin = await this.query_rows(this.poolProject, "select * from formsadmin");
        }
        return this.cachedFormsAdmin;
    }    

    async upSertElt<T>(src: T, table: string): Promise<T> {
        await this.poolProject.query(`insert into ${table}(data) values($1) on conflict((data->>'id')) do update set data=$1`,
            [JSON.stringify(src)]);
        return src;
    }

    async getFormsQuery(query: FormQuery, tables: DbTablesOption): Promise<DbArrayRes<FormRoot>> {
        const queryProcess = new FormsQueryProcess(this);
        return queryProcess.execute({ ...query, extMode: false }, tables);
    }
    
    async insertFormAssoc(assoc: FormAssoc, tables: DbTablesOption): Promise<FormAssoc> {
        await this.poolProject.query(
            SqlInsertBuilder.fromFormAssoc(assoc, tables)
        );        
        return assoc;
    }

    async insertFormsAssoc(elts: FormAssoc[], tables: DbTablesOption): Promise<boolean> {
        if(!elts?.length) {
            return true;
        }
        await this.poolProject.query(
            SqlInsertBuilder.fromFormsAssoc(elts, tables)
        );        
        return true;
    }

    async deleteFormAssoc(assoc: FormAssoc, tables: DbTablesOption): Promise<boolean> {
        await this.poolProject.query(SqlDeleteBuilder.fromFormAssoc(assoc, tables));
        return true;
    }

    async deleteFormsAssoc(ref: IndexType, tables: DbTablesOption): Promise<boolean> {
        await this.poolProject.query(SqlDeleteBuilder.fromFormAssocRef(ref, tables));
        return true;
    }

    async deleteFormsAssocs(assocs: FormAssoc[], tables: DbTablesOption) {
        if (!assocs?.length) {
            return false;
        }        
        await this.poolProject.query(SqlDeleteBuilder.fromFormsAssoc(assocs, tables));
    }

    async deleteFormsAssocIndices(ref: IndexType, indices: IndexType[], tables: DbTablesOption): Promise<boolean> {        
        await this.poolProject.query(
            SqlDeleteBuilder.fromFormAssocIndices(ref, indices, tables)
        );
        return true;
    }

    async checkTable(tableName: string) {
        const res = await this.query(`SELECT * FROM information_schema.tables where table_schema='public' and table_name='${tableName}'`);
        return res.rowCount > 0;
    }

    private async listenTableUpdate(configProject: any) {
        const client = new Client(configProject);
        this.tableUpdateClient = client;
        await client.connect();
        console.log("[DatabaseServer] PostgresDB client connected");
        await client.query('LISTEN "table_update"');
        console.log("[DatabaseServer] listen table");
        client.on("notification", (msg: any) => {
            try {
                const payload = JSON.parse(msg.payload);
                if (payload.table === "accounts") {
                    console.log("PostgresDB service table accounts changed clear cache");
                    this.clearCachedAccounts();
                } else if (payload.table === "projects") {
                    console.log("PostgresDB service table projects changed clear cache");
                    this.clearCachedProjects();
                } else if (payload.table === "formsroot") {
                    console.log("PostgresDB service table formsroot changed clear cache");
                    this.clearCachedFormsRoot();
                } else if (payload.table === "formsadmin") {
                    console.log("PostgresDB service table formsadmin changed clear cache");
                    this.clearCachedFormsAdmin();
                }
                this.tableUpdate$.next(payload);
            } catch (err) {
                console.log("unknown notification received", msg);
            }
        });
    }

    private async closeTableUpdate() {
        if (this.tableUpdateClient) {
            await this.tableUpdateClient.end();
            this.tableUpdateClient = undefined;
        }
    }

    private async query_rows<T>(pool: Pool, text: string) {
        const res = await pool.query<{ data: T }>(text);
        return res.rows.map(elt => elt.data);
    }
}