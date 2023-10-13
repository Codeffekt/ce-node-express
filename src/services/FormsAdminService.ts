import { DbArrayRes, FormInstance, FormInstanceExt, FormQuery, IndexType } from "@codeffekt/ce-core-data";
import { ReplaySubject } from "rxjs";
import { filter } from "rxjs/operators";
import { Inject, Service } from "../core/CeService";
import { DB_TABLE_ACCOUNTS, DB_TABLE_FORMS, DB_TABLE_FORMSROOT, DB_TABLE_FORMS_ASSOC } from "../core/Db";
import { DatabaseServer, isFormsAdminUpdate } from "../servers/DatabaseServer";
import { ContextService } from "./ContextService";
import { FormsQueryProcess } from "./FormsQueryProcess";
import { FormsUpdateEvent } from "./FormsService";

@Service()
export class FormsAdminService {

    formUpdate$: ReplaySubject<FormsUpdateEvent> = new ReplaySubject();

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    @Inject(ContextService)
    private readonly context: ContextService;

    constructor() {}

    onFormsAdminChanged() {
        return this.db.tableUpdate$.pipe(
            filter(isFormsAdminUpdate)
        );
    }

    getFormAdmin(id: IndexType): Promise<FormInstanceExt> {
        return this.db.getCachedFormsAdmin()
            .then(root => root.find(elt => elt.id === id));
    }

    getFormsAdmin() {
        return this.db.getCachedFormsAdmin();
    }

    getFormsAdminQuery(query: FormQuery): Promise<DbArrayRes<FormInstanceExt>> {
        const queryProcess = new FormsQueryProcess();
        return queryProcess.execute({ ...query, extMode: false }, 
            { 
                formsTableName: DB_TABLE_FORMS,
                formsRootTableName: DB_TABLE_FORMSROOT,
                accountsTableName: DB_TABLE_ACCOUNTS,
                assocsTableName: DB_TABLE_FORMS_ASSOC,
                rootTableName: "formsadmin"
            });
    }

    deleteFormAdmin(id: IndexType): Promise<boolean> {
        return this.db.poolProject.query("delete from formsadmin where data->>'id'=$1", [id])
            .then((res: any) => res.rowCount > 0);
    }

    async upsertFormAdmin(src: FormInstance): Promise<FormInstance> {
        await this.db.poolProject.query("insert into formsadmin(data) values($1) on conflict((data->>'id')) do update set data=$1",
            [JSON.stringify(src)])
        return src;
    }
}