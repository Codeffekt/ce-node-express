import { DbArrayRes, FormAssoc, FormQuery, FormRoot, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import {
    DB_TABLE_ACCOUNTS, DB_TABLE_FORMS,
    DB_TABLE_FORMSROOT, DB_TABLE_FORMSROOT_ASSOC,
    DbTablesOption
} from "../core/Db";
import { DatabaseServer } from "../servers/DatabaseServer";
import { MessagesServer } from "../servers/MessagesServer";
import { ContextService } from "./ContextService";

@Service()
export class FormsRootService {

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;    

    @Inject(ContextService)
    private readonly context: ContextService;

    @Inject(MessagesServer)
    private readonly ms: MessagesServer;

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

    async upsertFormRoot(src: FormRoot, author: IndexType): Promise<FormRoot> {
        const root = this.sanitizeForm(src, Date.now());        
        const res = await this.db.upSertElt(root, this.dbTables.formsRootTableName);
        this.ms.sendFormsRootUpsert(root, author);
        return res;
    }

    sanitizeForm(form: FormRoot, mtime?: number) {
        return this.context.sanitizeFormRoot(form, mtime);
    }

    getFormsQuery(query: FormQuery): Promise<DbArrayRes<FormRoot>> {
        return this.db.getFormsQuery(query, this.dbTables);
    }

    async insertFormAssoc(assoc: FormAssoc): Promise<FormAssoc> {
        return this.db.insertFormAssoc(assoc, this.dbTables);        
    }

    async insertFormsAssoc(elts: FormAssoc[]): Promise<boolean> {
        return this.db.insertFormsAssoc(elts, this.dbTables);
    }

    async deleteFormAssoc(assoc: FormAssoc): Promise<boolean> {
        return this.db.deleteFormAssoc(assoc, this.dbTables);
    }

    async deleteFormsAssoc(ref: IndexType): Promise<boolean> {
        return this.db.deleteFormsAssoc(ref, this.dbTables);
    }

    async deleteFormsAssocs(assocs: FormAssoc[]) {
        return this.db.deleteFormsAssocs(assocs, this.dbTables);
    }

    async deleteFormsAssocIndices(ref: IndexType, indices: IndexType[]): Promise<boolean> {        
        return this.db.deleteFormsAssocIndices(ref, indices, this.dbTables);
    }
}