import { FormQueryFieldExpr } from "@codeffekt/ce-core-data";
import { FormQueryFieldUtils } from "./FormQueryFieldUtils";
import { SqlWhere } from "./SqlASTTypes";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic, SqlWhereExprLogicOp } from "./SqlWhereExprLogic";

export class FormQueryLogicUtils {

    static getUniquesContextsFromQueryFieldExpr(queryFieldExpr: FormQueryFieldExpr, contexts: string[]): string[] {
        if (FormQueryFieldUtils.isFormQueryFieldLogicAnd(queryFieldExpr)) {
            for (const qf of queryFieldExpr.and) {
                this.getUniquesContextsFromQueryFieldExpr(qf, contexts);
            }

        } else if (FormQueryFieldUtils.isFormQueryFieldLogicOr(queryFieldExpr)) {
            for (const qf of queryFieldExpr.or) {
                this.getUniquesContextsFromQueryFieldExpr(qf, contexts);
            }
        } else if (FormQueryFieldUtils.isFormQueryFieldContext(queryFieldExpr) &&
            !contexts.includes(queryFieldExpr.context)) {
            contexts.push(queryFieldExpr.context);
        }
        return contexts;
    }

    static combineSqlWhereExpr(elts: SqlWhereExprElt[], op: SqlWhereExprLogicOp): SqlWhere {
        if (!elts.length) {
            return undefined;
        } else if (elts.length === 1) {
            return elts[0];
        } else {
            return new SqlWhereExprLogic({
                op,
                left: elts[0],
                right: elts.length === 2 ? elts[1] : this.combineSqlWhereExpr(elts.slice(2), op)
            });
        }
    }
}