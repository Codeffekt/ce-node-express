import { FormQuery, FormQueryFieldLogic } from "@codeffekt/ce-core-data";
import { FormQueryFieldUtils } from "./FormQueryFieldUtils";
import { FormQueryLogicUtils } from "./FormQueryLogicUtils";
import { SqlWhere } from "./SqlASTTypes";
import { SqlFromSelect } from "./SqlFromSelect";
import { SqlFromTableBuilder } from "./SqlFromTableBuilder";
import { SqlSelectBuilder, SqlSelectBuilderOptions } from "./SqlSelectBuilder";
import { SqlWhereExprBuilder } from "./SqlWhereExprBuilder";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic } from "./SqlWhereExprLogic";

export interface SqlSelectProcessOptions extends SqlSelectBuilderOptions {
    select: SqlFromSelect
}

export class SqlSelectProcess {

    constructor(private options: SqlSelectProcessOptions) { }

    addFormQueryFields(rootExpr: FormQueryFieldLogic) {

        const select = this.options.select;

        // TODO: getUniquesContexts from queryfields and sortfields !
        const contexts = FormQueryLogicUtils.getUniquesContextsFromQueryFieldExpr(rootExpr, []);

        const exprContexts = FormQueryLogicUtils.combineSqlWhereExpr(
            contexts.map(ctx => new SqlWhereExprBuilder(this.options).fromContext(ctx)),
            "and");
        for (const context of contexts) {
            select.addFrom(new SqlSelectBuilder(this.options).fromContext(context));
        }

        const exprFields = new SqlWhereExprBuilder(this.options).fromQueryFieldExpr(rootExpr, { id: 'root' });

        select.setWhereRoot(
            exprContexts ? new SqlWhereExprLogic({
                left: exprContexts,
                op: "and",
                right: exprFields
            }) : exprFields
        );

        const uniqueQueryFields = FormQueryFieldUtils.getUniquesFieldsFromQueryFieldExpr(rootExpr, [], { id: 'root' });

        for (const field of uniqueQueryFields) {
            select.addFrom(
                FormQueryFieldUtils.isFormAssocType(field.qf) ?
                    new SqlSelectBuilder(this.options).fromFormAssoc(field) :
                    new SqlFromTableBuilder(this.options).fromQueryField(field));
        }

        return select;

    }

    addCTimeRangePart(query: FormQuery) {

        if (!query.cTimeRange) {
            return;
        }

        console.warn(`<FormQueryParser> using CTimeRangePart is deprecated, please use queryRootFields instead`);

        const cTimeField = "(data->>'ctime')::bigint";
        let expr: SqlWhere;
        if (query.cTimeRange[0] && query.cTimeRange[1]) {
            expr = new SqlWhereExprLogic({
                left: new SqlWhereExprElt({ field: cTimeField, op: ">=", value: query.cTimeRange[0].toString() }),
                op: "and",
                right: new SqlWhereExprElt({ field: cTimeField, op: "<", value: query.cTimeRange[1].toString() })
            });
        } else if (query.cTimeRange[0]) {
            expr = new SqlWhereExprElt({ field: cTimeField, op: ">=", value: query.cTimeRange[0].toString() });
        } else {
            expr = new SqlWhereExprElt({ field: cTimeField, op: "<", value: query.cTimeRange[1].toString() });
        }
        this.options.select.addWhereAnd(expr);

    }

    addMTimeSort(query: FormQuery) {
        if (query.sortOrderMTime) {

            console.warn(`<FormQueryParser> using MTime sort is deprecated, please use sortRootFields instead`);

            this.addTimeFieldSort("mtime", query.sortOrderMTime);
        }
    }

    addCTimeSort(query: FormQuery) {
        this.addTimeFieldSort("ctime", query.sortOrderCTime);
    }

    addTimeFieldSort(prop: "ctime" | "mtime", order?: "asc" | "desc") {
        this.options.select.addOrder({
            field: `${this.getDataField()}->>'${prop}'`, sort: order || "desc"
        });
    }

    private getDataField(context?: string) {
        return `${this.options.rootTableName}${context ? `_${context}` : ''}.data`;
    }
}