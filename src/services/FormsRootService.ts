import { DbArrayRes, FormAssoc, FormQuery, FormRoot, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import {
    DB_TABLE_ACCOUNTS, DB_TABLE_FORMS,
    DB_TABLE_FORMSROOT, DB_TABLE_FORMSROOT_ASSOC,
    DbTablesOption
} from "../core/Db";
import { DatabaseServer } from "../servers/DatabaseServer";
import { SqlInsertBuilder } from "../forms-sql/SqlInsertBuilder";
import { SqlDeleteBuilder } from "../forms-sql/SqlDeleteBuilder";
import { FormsQueryProcess } from "./FormsQueryProcess";

@Service()
export class FormsRootService {

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;    

    private dbTables: DbTablesOption = {
        formsTableName: DB_TABLE_FORMS,
        formsRootTableName: DB_TABLE_FORMSROOT,
        assocsTableName: DB_TABLE_FORMSROOT_ASSOC,
        accountsTableName: DB_TABLE_ACCOUNTS,
        rootTableName: DB_TABLE_FORMSROOT,
    };

    constructor() {
    }

    getFormRoot(id: IndexType): Promise<FormRoot> {
        return this.db.getCachedFormsRoot()
            .then(root => root.find(elt => elt.id === id));
    }

    getFormsQuery(query: FormQuery): Promise<DbArrayRes<FormRoot>> {
        const queryProcess = new FormsQueryProcess();
        return queryProcess.execute({ ...query, extMode: false }, this.dbTables);
    }

    async insertFormAssoc(assoc: FormAssoc): Promise<FormAssoc> {
        await this.db.poolProject.query(
            SqlInsertBuilder.fromFormAssoc(assoc, this.dbTables)
        );        
        return assoc;
    }

    async insertFormsAssoc(elts: FormAssoc[]): Promise<boolean> {
        if(!elts?.length) {
            return true;
        }
        await this.db.poolProject.query(
            SqlInsertBuilder.fromFormsAssoc(elts, this.dbTables)
        );        
        return true;
    }

    async deleteFormAssoc(assoc: FormAssoc): Promise<boolean> {
        await this.db.poolProject.query(SqlDeleteBuilder.fromFormAssoc(assoc, this.dbTables));
        return true;
    }

    async deleteFormsAssoc(ref: IndexType): Promise<boolean> {
        await this.db.poolProject.query(SqlDeleteBuilder.fromFormAssocRef(ref, this.dbTables));
        return true;
    }

    async deleteFormsAssocs(assocs: FormAssoc[]) {
        if (!assocs?.length) {
            return false;
        }        
        await this.db.poolProject.query(SqlDeleteBuilder.fromFormsAssoc(assocs, this.dbTables));
    }

    async deleteFormsAssocIndices(ref: IndexType, indices: IndexType[]): Promise<boolean> {        
        await this.db.poolProject.query(
            SqlDeleteBuilder.fromFormAssocIndices(ref, indices, this.dbTables)
        );
        return true;
    }
}