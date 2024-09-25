import {
    FormAggField,
    FormQuery, FormQueryField,
    FormQueryFieldExpr, FormQuerySortField
} from "@codeffekt/ce-core-data";
import { DB_TABLE_FORMS, DB_TABLE_FORMSROOT, DB_TABLE_FORMS_ASSOC, DbTablesOption } from "../core/Db";
import { FormQueryLogicUtils } from "./FormQueryLogicUtils";
import { FormQueryUtils } from "./FormQueryUtils";
import { SqlAggFactory } from "./SqlAggFactory";
import { SqlFromTable, SqlSelectFields, SqlSelectFieldsElt, SqlWhere } from "./SqlASTTypes";
import { SqlFromSelect } from "./SqlFromSelect";
import { SqlSelect } from "./SqlSelect";
import { SqlSelectBuilder } from "./SqlSelectBuilder";
import { SqlSelectProcess } from "./SqlSelectProcess";
import { SqlWhereExprBuilder } from "./SqlWhereExprBuilder";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic, SqlWhereExprLogicOp } from "./SqlWhereExprLogic";
import { SqlWhereFactory } from "./SqlWhereFactory";
import { SqlWhereFilterBuilder } from "./SqlWhereFilterBuilder";
import { SqlWhereRootFactory } from "./SqlWhereRootFactory";
import { SqlQueryField, SqlQueryFieldParent } from "./SqlQueryField";
import { FormQueryFieldUtils } from "./FormQueryFieldUtils";

// select forms.total as total, forms.data as data from 
// (select count(*) over() as total, forms.data as data from 
// (select * from forms order by  forms.data->>'ctime' desc ) forms  ) forms

export type FormQueryParserOptions = DbTablesOption;

export class FormQueryParser {

    private exprFactory: SqlWhereFactory = new SqlWhereFactory();
    private exprRootFactory: SqlWhereRootFactory = new SqlWhereRootFactory();
    private exprAggFactory: SqlAggFactory = new SqlAggFactory();

    constructor(private query: FormQuery, private options: FormQueryParserOptions = {
        formsTableName: DB_TABLE_FORMS,
        formsRootTableName: DB_TABLE_FORMSROOT,
        assocsTableName: DB_TABLE_FORMS_ASSOC,
        accountsTableName: DB_TABLE_FORMS_ASSOC,
        rootTableName: DB_TABLE_FORMS,
    }) {

    }

    toAST(): SqlSelect {

        const selectFields = this.createSelectFields([
            {
                field: "count(*) over()",
                alias: "total"
            },
            {
                field: this.getDataField(),
                alias: "data"
            },
            {
                field: "nextval('temp_seq')",
                alias: "row_number"
            }
        ]);

        const aggFields = this.query.aggFields?.length ?
            this.createAggFields() : [];

        const select = new SqlSelect({
            fields: [
                {
                    field: `${this.options.rootTableName}.total`,
                    alias: "total"
                },
                {
                    field: this.getDataField(),
                    alias: "data"
                },
                ...aggFields
            ],
            from: [
                selectFields
            ],
            order: [
                {
                    field: "row_number",
                    sort: "asc"
                }
            ]
        });

        this.addExtModePart(select);

        return select;
    }

    toSelectFieldsIdsAST(): SqlSelect {
        return this.createSelectFields([
            {
                field: `${this.getDataField()}->>'id'`,
                alias: "id"
            }
        ]);
    }

    private createSelectFields(fields: SqlSelectFields) {
        const select = new SqlFromSelect({
            fields,
            from: [
                this.createSelectRef()
            ],
            alias: `${this.options.rootTableName}`
        });
        this.addQueryFieldsPart(select);
        this.addFiltersPart(select);
        // add sort fields with context
        this.addSortFieldsPartContext(select);
        this.addLimitPart(select);
        return select;
    }

    private createAggFields() {
        return this.query.aggFields.map(agg => this.createAggField(agg));
    }

    private createAggField(agg: FormAggField): SqlSelectFieldsElt {
        return {
            field: this.exprAggFactory.create(agg, this.options.rootTableName),
            alias: `agg_${agg.field}`
        };
    }

    private getDataField(context?: string) {
        return `${this.options.rootTableName}${context ? `_${context}` : ''}.data`;
    }

    private getTableContent(context?: string) {
        return `jsonb_each(${this.getDataField(context)}#>'{content}')`;
    }

    private getTableContentForceIndex(context?: string) {
        return `jsonb_each(${this.getDataField(context)}#>'{content}' || '{"_":{"type":"index"}}'::jsonb)`;
    }

    private getSortTableAlias(qs: FormQuerySortField) {
        return `s_obj_${qs.context ? `${qs.context}_` : ''}${qs.field}`;
    }

    private addExtModePart(select: SqlSelect) {
        if (!this.query.extMode) {
            return;
        }

        select
            .addField({ field: "f_obj.key", alias: "f_name" })
            .addField({ field: "f_obj.value->>'value'", alias: "f_value" })
            .addField({ field: "f_forms.data", alias: "f_form" });

        select.addFrom(new SqlFromTable({ name: this.options.rootTableName, alias: "f_forms" }));

        select.addJoin({
            table: new SqlFromTable({ name: this.getTableContentForceIndex(), alias: "f_obj" }),
            type: "RIGHT OUTER JOIN",
            on: new SqlWhereExprElt({ field: "f_forms.data->>'id'", op: "=", value: "f_obj.value->>'value'" })
        });

        select.setWhereRoot(new SqlWhereExprElt({ field: "f_obj.value->>'type'", op: "=", value: "'index'" }));
    }

    private addQueryFieldsRootPart(select: SqlFromSelect) {

        if (!this.query.queryRootFields) {
            return;
        }

        console.warn(`<FormQueryParser> using QueryRootFields is deprecated, please use QueryFields with onMeta instead`);

        const rootExpr = Array.isArray(this.query.queryRootFields) ? {
            and: this.query.queryRootFields
        } : this.query.queryRootFields;

        const exprFields = this.createSqlExprFromQueryRootFieldExpr(rootExpr, { id: 'root' });

        select.addWhereAnd(exprFields);
    }

    private addFiltersPart(select: SqlFromSelect) {
        if (!this.query.filters?.length) {
            return;
        }

        for (let i = 0; i < this.query.filters.length; ++i) {
            const filter = this.query.filters[i];
            const filterName = `filter_${i}`;
            const expr = new SqlWhereFilterBuilder({
                ...this.options,
                tableName: "sub",
                filterName
            }).fromFilter(filter);
            select.addWhereAnd(expr as any);
        }
    }

    private addQueryFieldsPart(select: SqlFromSelect) {

        if (!this.query.queryFields) {
            return;
        }

        const rootExpr = Array.isArray(this.query.queryFields) ? {
            and: this.query.queryFields
        } : this.query.queryFields;

        const process = new SqlSelectProcess({
            ...this.options,
            select
        });

        process.addFormQueryFields(rootExpr);
    }

    private createSqlExprFromQueryRootFieldExpr(queryFieldExpr: FormQueryFieldExpr, parent: SqlQueryFieldParent) {
        if (FormQueryFieldUtils.isFormQueryFieldLogicAnd(queryFieldExpr)) {
            return this.createSqlExprQueryRootFieldArray(
                queryFieldExpr.and,
                "and",
                { type: 'and', id: `${parent.id}_and` });
        } else if (FormQueryFieldUtils.isFormQueryFieldLogicOr(queryFieldExpr)) {
            return this.createSqlExprQueryRootFieldArray(
                queryFieldExpr.or,
                "or",
                { type: 'or', id: `${parent.id}_or` });
        } else {
            return this.createSqlExprEltFromQueryRootField({
                qf: queryFieldExpr as FormQueryField,
                parent
            });
        }
    }

    private createSqlExprQueryRootFieldArray(queryFields: FormQueryFieldExpr[], op: SqlWhereExprLogicOp, parent: SqlQueryFieldParent): SqlWhere {
        if (!queryFields.length) {
            return undefined;
        }

        if (queryFields.length === 1) {
            return this.createSqlExprFromQueryRootFieldExpr(queryFields[0], parent);
        }

        return new SqlWhereExprLogic({
            left: this.createSqlExprFromQueryRootFieldExpr(queryFields[0], parent),
            op,
            right: this.createSqlExprQueryRootFieldArray(queryFields.slice(1), op, parent)
        });
    }

    private createSqlExprEltFromQueryRootField(sqlField: SqlQueryField): SqlWhere {
        return this.exprRootFactory.create({
            ...sqlField,
            qf: {
                ...sqlField.qf,
                context: this.options.rootTableName
            }
        });
    }

    private addLimitPart(select: SqlFromSelect) {
        if (this.query.limit || this.query.offset) {
            select.setLimit({
                limit: this.query.limit,
                offset: this.query.offset
            });
        }
    }

    private createSelectRef() {
        const select = new SqlFromSelect({
            fields: [
                {
                    field: "*"
                }
            ],
            from: [
                new SqlFromTable({
                    name: this.options.rootTableName
                })
            ],
            alias: this.options.rootTableName
        });

        this.addRefPart(select);
        this.addFormRootPart(select);
        this.addIndicesPart(select);
        this.addQueryFieldsRootPart(select);
        this.addSortFieldsPartRef(select);

        return select;
    }

    private addFormRootPart(select: SqlFromSelect) {
        if (!this.query.formRoot) {
            return;
        }

        console.warn(`<FormQueryParser> using formRoot is deprecated, please use queryRootFields instead`);

        select.addWhereAnd(new SqlWhereExprElt({
            field: `${this.getDataField()}->>'root'`,
            op: "=",
            value: `'${this.query.formRoot}'`
        }));
    }

    private addIndicesPart(select: SqlFromSelect) {
        if (!this.query.indices || !Array.isArray(this.query.indices)) {
            return;
        }

        console.warn(`<FormQueryParser> using indices is deprecated, please use queryRootFields instead`);

        if (this.query.indicesExcluded) {
            select.addWhereAnd(new SqlWhereExprElt({
                field: `${this.getDataField()}->>'id' `,
                op: "not in",
                value: `(${this.query.indices.map(idx => `'${idx}'`).join(",")})`
            }));
        } else {
            select.addWhereAnd(new SqlWhereExprElt({
                field: `${this.getDataField()}->>'id' `,
                op: "=",
                value: `ANY(ARRAY[${this.query.indices.map(idx => `'${idx}'`).join(",")}]::text[])`
            }));
        }
    }

    private addSortFieldsPartRef(select: SqlFromSelect) {
        if (this.query.sortFields) {
            this.addSortFieldsPart(select, this.query.sortFields.filter(sf => !sf.context && !sf.onMeta));
            this.addSortRootFieldsPart(select, this.query.sortFields.filter(sf => sf.onMeta));
        }

        if (this.query.sortRootFields) {
            console.warn(`<FormQueryParser> using SortRootFields is deprecated, please use SortFields with onMeta instead`);
            this.addSortRootFieldsPart(select, this.query.sortRootFields);
        }

        const selectProcess = new SqlSelectProcess({
            ...this.options,
            select
        });

        selectProcess.addCTimeRangePart(this.query);
        selectProcess.addMTimeSort(this.query);
        selectProcess.addCTimeSort(this.query);
    }

    private addSortFieldsPartContext(select: SqlFromSelect) {
        if (!this.query.sortFields) {
            return;
        }

        const sortFields = this.query.sortFields.filter(sf => sf.context !== undefined);

        const exprSortFields = FormQueryLogicUtils.combineSqlWhereExpr(
            sortFields.map(sf => new SqlWhereExprBuilder(this.options).fromContext(sf.context)),
            "and");

        if (exprSortFields) {
            select.addWhereAnd(exprSortFields);
        }

        for (const sf of sortFields) {
            select.addFrom(new SqlSelectBuilder(this.options).fromContext(sf.context));
        }

        this.addSortFieldsPart(select, sortFields);
    }

    private getSqlSortField(sf: FormQuerySortField, alias: string): string {
        const sortType = this.exprFactory.getFieldType(sf.type);
        const fieldValuePath = FormQueryUtils.getFieldValue(sf, alias);
        return sortType ? `(${fieldValuePath})::${sortType}` : `${fieldValuePath}`;
    }

    private addSortRootFieldsPart(select: SqlFromSelect, fields: FormQuerySortField[]) {
        for (const sf of fields) {
            select.addOrder({
                field: this.getSqlSortRootField(sf),
                sort: sf.order
            });
        }
    }

    private getSqlSortRootField(sf: FormQuerySortField): string {
        const sortType = this.exprRootFactory.getFieldType(sf.type);
        const fieldValuePath = this.exprRootFactory.getAliasValue({
            parent: {
                id: 'root'
            },
            qf: {
                ...sf,
                context: this.options.rootTableName
            }
        });
        return sortType ? `(${fieldValuePath})::${sortType}` : `${fieldValuePath}`;
    }

    private addSortFieldsPart(select: SqlFromSelect, fields: FormQuerySortField[]) {
        for (const sf of fields) {
            const alias = this.getSortTableAlias(sf);
            select.addFrom(new SqlFromTable({
                name: this.getTableContent(sf.context),
                alias
            }));
            select.addWhereAnd(new SqlWhereExprElt({
                field: `${alias}.key`,
                op: "=",
                value: `'${sf.field}'`
            }));
            select.addOrder({
                field: this.getSqlSortField(sf, alias),
                sort: sf.order
            });
        }
    }

    private addRefPart(select: SqlFromSelect) {
        if (this.query.ref || this.query.refs?.length) {
            select.addFrom<SqlFromTable>({
                name: this.options.assocsTableName
            });

            const refValue = this.query.ref ?
                `'${this.query.ref}'` :
                `ANY(ARRAY[${this.query.refs.map(idx => `'${idx}'`).join(",")}]::text[])`;

            select.setWhereRoot(new SqlWhereExprLogic({
                left: new SqlWhereExprElt({
                    field: `${this.options.assocsTableName}.ref`,
                    op: "=",
                    value: refValue
                }),
                op: "and",
                right: new SqlWhereExprElt({
                    field: `${this.options.assocsTableName}.form`,
                    op: "=",
                    value: `${this.getDataField()}->>'id'`
                })
            }));
        }
    }
}