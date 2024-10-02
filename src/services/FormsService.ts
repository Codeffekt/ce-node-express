import {
    CoreIndexElt,
    DbArrayRes, EltNotFoundError,
    FormAssoc, FormBlock, FormInstance,
    FormInstanceExt, FormQuery,
    FormRoot, FormUtils, FORM_MASK_ROOT, FORM_STYLE_ROOT, IFormRootEntity, IndexType, Utils
} from "@codeffekt/ce-core-data";
import * as format from "pg-format";
import { ReplaySubject } from "rxjs";
import { filter } from "rxjs/operators";
import { Inject, Service } from "../core/CeService";
import { 
    DB_TABLE_ACCOUNTS, DB_TABLE_FORMS, 
    DB_TABLE_FORMSROOT, DB_TABLE_FORMSROOT_ASSOC, 
    DB_TABLE_FORMS_ASSOC, DbTablesOption } from "../core/Db";
import { FormQueryParser } from "../forms-sql/FormQueryParser";
import { SqlRenderer } from "../forms-sql/SqlRenderer";
import { DatabaseServer, isFormsRootUpdate } from "../servers/DatabaseServer";
import { ContextService } from "./ContextService";
import { FormsQueryProcess } from "./FormsQueryProcess";
import { SqlInsertBuilder } from "../forms-sql/SqlInsertBuilder";
import { SqlDeleteBuilder } from "../forms-sql/SqlDeleteBuilder";

const QUERY_FORMS_ASSOC = `select (select count(*) from forms, forms_assoc where ref=$1 and data->>'id'=form) as total, 
data from forms, forms_assoc where ref=$1 and data->>'id'=form`;

export interface FormsUpdateEvent {
    elts: FormInstanceExt[];
    author: IndexType;
}

@Service()
export class FormsService {

    formUpdate$: ReplaySubject<FormsUpdateEvent> = new ReplaySubject();

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    @Inject(ContextService)
    private readonly context: ContextService;

    private dbTables: DbTablesOption = {
        formsTableName: DB_TABLE_FORMS, 
        formsRootTableName: DB_TABLE_FORMSROOT,
        assocsTableName: DB_TABLE_FORMS_ASSOC,
        accountsTableName: DB_TABLE_ACCOUNTS,
        rootTableName: DB_TABLE_FORMSROOT,
    };

    constructor() {
    }

    onFormsRootChanged() {
        return this.db.tableUpdate$.pipe(
            filter(isFormsRootUpdate)
        );
    }

    getFormRoot(id: IndexType): Promise<FormRoot> {
        return this.db.getCachedFormsRoot()
            .then(root => root.find(elt => elt.id === id));
    }

    getFormRoots() {
        return this.db.getCachedFormsRoot();
    }    

    deleteFormRoot(id: IndexType): Promise<boolean> {
        return this.db.poolProject.query("delete from formsroot where data->>'id'=$1", [id])
            .then((res: any) => res.rowCount > 0);
    }

    async upsertFormRoot(src: FormRoot): Promise<FormRoot> {
        await this.db.poolProject.query("insert into formsroot(data) values($1) on conflict((data->>'id')) do update set data=$1",
            [JSON.stringify(src)])
        return src;
    }

    async updateForm(src: FormInstance, author: IndexType): Promise<FormInstance> {
        await this.db.poolProject.query(`update forms set data=$1 where data->>'id'=$2`,
            [JSON.stringify(src), src.id]);
        this.formUpdate$.next({ elts: [src], author });
        return src;
    }

    async getForm(id: IndexType): Promise<FormInstance> {
        const res = await this.db.poolProject.query(`select data from forms where data->>'id'=$1`, [id]);
        if (!res.rows.length) {
            throw new EltNotFoundError("element id=" + id + " not found", { tableName: 'forms', id: id });
        }
        return res.rows[0].data;
    }

    getFormsQuery(query: FormQuery): Promise<DbArrayRes<FormInstanceExt>> {
        const queryProcess = new FormsQueryProcess();
        return queryProcess.execute(query);
    }

    async getFormQuery(id: IndexType, query: FormQuery): Promise<FormInstance | FormInstanceExt> {

        const extMode = query.extMode ? await this.formHaveIndexBlock(id) : undefined;

        const res = await this.getFormsQuery({
            ...query,
            limit: 1,
            offset: 0,
            indices: [id],
            extMode,
        });

        if (!res.elts.length) {
            return undefined;
        }

        const form = res.elts[0];

        if (query.withMaskCat) {
            const formMask = await this.getFormCategory(query.withMaskCat, FORM_MASK_ROOT, form.root);
            FormUtils.addLocalForm(form, formMask);
        }

        if (query.withStyleCat) {
            const formStyle = await this.getFormCategory(query.withStyleCat, FORM_STYLE_ROOT, form.root);
            FormUtils.addLocalForm(form, formStyle);
        }

        return form;
    }

    async getFormCategory(category: IndexType, formRoot: IndexType, root: IndexType): Promise<FormInstance> {
        const res = await this.getFormsQuery(
            this.createQueryCategory(category, formRoot, root)
        );

        return res.elts.length ? res.elts[0] : undefined;
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

    async insertForm(elt: FormInstance, author: IndexType): Promise<FormInstance> {
        await this.db.poolProject.query("insert into forms (data) values($1)", [JSON.stringify(elt)]);
        this.formUpdate$.next({ elts: [elt], author });
        return elt;
    }

    async insertForms(elts: FormInstance[], author: IndexType): Promise<boolean> {
        if(!elts?.length) {
            return true;
        }

        const query = format(`insert into forms(data) values %L on conflict((data->>'id')) do update set data=excluded.data`, elts.map(elt => [elt]));
        await this.db.poolProject.query(query);
        this.formUpdate$.next({ elts, author });
        return true;
    }

    async deleteFormAssoc(assoc: FormAssoc): Promise<boolean> {
        await this.db.poolProject.query(SqlDeleteBuilder.fromFormAssoc(assoc, this.dbTables));
        return true;
    }

    async deleteForms(elts: IndexType[]): Promise<boolean> {
        if(!elts?.length) {
            return true;
        }

        const values = elts.map(elt => `'${elt}'`).join(',');
        const query = `delete from forms where data->>'id'=ANY(ARRAY[${values}]::text[])`;
        await this.db.poolProject.query(query);
        return true;
    }

    async deleteFormsQuery(query: FormQuery): Promise<boolean> {
        const parser = new FormQueryParser(query);
        const queryFields = SqlRenderer.renderSQLFromSqlAST(parser.toSelectFieldsIdsAST());

        // delete forms
        let queryDB = `delete from forms where data->>'id' in (${queryFields})`;
        await this.db.poolProject.query(queryDB);

        // delete formsAssoc
        queryDB = `delete from forms_assoc where form in (${queryFields})`;
        await this.db.poolProject.query(queryDB);

        return true;
    }

    async deleteFormsAssoc(ref: IndexType): Promise<boolean> {
        await this.db.poolProject.query(SqlDeleteBuilder.fromFormAssocRef(ref, this.dbTables));
        return true;
    }

    async deleteFormsAssocFromForm(form: IndexType): Promise<boolean> {
        await this.db.poolProject.query(SqlDeleteBuilder.fromFormAssocForm(form, this.dbTables));
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

    getFormsFromAssoc(query: FormQuery): Promise<DbArrayRes<FormInstance>> {
        const sqlQuery = QUERY_FORMS_ASSOC;
        const sqlCTimeOrder = `order by data->>'ctime' ${query.sortOrderCTime ? query.sortOrderCTime : 'desc'}`;
        const sqlLimit = query.limit > 0 ? `limit ${query.limit} offset ${query.offset}` : '';
        const sqlCTimeRangeInf = query.cTimeRange && query.cTimeRange[0] ? `and (data->>'ctime')::bigint >= ${query.cTimeRange[0]}` : '';
        const sqlCTimeRangeSup = query.cTimeRange && query.cTimeRange[1] ? `and (data->>'ctime')::bigint < ${query.cTimeRange[1]}` : '';

        const query$ = this.db.poolProject.query(`${sqlQuery} ${sqlCTimeRangeInf} ${sqlCTimeRangeSup} ${sqlCTimeOrder} ${sqlLimit}`, [query.ref]);

        return query$.then((res: any) => ({
            total: res.rows.length ? res.rows[0].total : 0,
            limit: query.limit,
            offset: query.offset,
            elts: res.rows.map((row: any) => row.data)
        }));
    }

    async getFormAssocs(query: FormQuery): Promise<DbArrayRes<FormAssoc>> {
        const sqlQuery = `select (select count(*) from ${this.dbTables.assocsTableName} where ref=$1) as total, 
        ref, form from ${this.dbTables.assocsTableName} where ref=$1`;
        const sqlLimit = query.limit > 0 ? `limit ${query.limit} offset ${query.offset}` : '';
        const res = await this.db.poolProject.query(`${sqlQuery} ${sqlLimit}`, [query.ref]);
        return {
            total: res.rows.length ? res.rows[0].total : 0,
            limit: query.limit,
            offset: query.offset,
            elts: res.rows.map((row: any) => ({ ref: row.ref, form: row.form }))
        };
    }

    createForm(root: FormRoot, author?: IndexType): FormInstance {
        return this.createFormWithCore(root, {
            id: this.context.createUnique(),
            ctime: Date.now(),
        }, author);
    }

    createFormWithCore(root: FormRoot, context: CoreIndexElt, author?: IndexType): FormInstance {
        const newInstance = {
            ...Utils.deepcopy(root),
            valid: true,
            ...context,
            root: root.id,
            author: author
        };
        for (const block of Object.values(newInstance.content)) {
            if (!FormUtils.isDefined(block.value) && FormUtils.isDefined(block.defaultValue)) {
                block.value = block.defaultValue;
            }
        }
        return newInstance;
    }

    createFormFromEntity(entity: any, author?: IndexType): FormInstance {
        if (!entity._formBase) {
            throw new Error("Cannot create form instance, property _formBase missing");
        }
        return entity._getFormInstance(this.context.createUnique(), author);
    }

    getRequiredFormsFromEntity(entity: any): FormBlock[] {
        return Object.values((<IFormRootEntity>entity)._formBase.content)
            .filter(block => block.type === "index" && block.required && block.root);
    }

    getRequiredFormsFromRoot(form: FormRoot): FormBlock[] {
        return FormUtils.getBlocksAsArray(form).filter(
            block => block.type === "index" && block.required && block.root
        );
    }

    sanitizeForm(form: FormInstanceExt, author?: IndexType, mtime?: number) {
        return this.context.sanitizeForm(form, author, mtime);
    }

    sanitizeFormRoot(form: FormRoot, mtime?: number) {
        return this.context.sanitizeFormRoot(form, mtime) as any;
    }

    private async formHaveIndexBlock(formId: IndexType) {
        const form = await this.getForm(formId);
        return Object.values(form.content).find(b => FormUtils.isBlockIndex(b)) !== undefined;
    }

    private createQueryCategory(category: IndexType, formRoot: IndexType, root: IndexType): FormQuery {
        return {
            formRoot,
            limit: 1,
            offset: 0,
            extMode: false,
            queryFields: [
                {
                    field: "category",
                    op: "=",
                    value: category
                },
                {
                    field: "root",
                    op: "=",
                    value: root
                },
                {
                    field: "disabled",
                    op: "="
                }
            ]
        }
    }
}