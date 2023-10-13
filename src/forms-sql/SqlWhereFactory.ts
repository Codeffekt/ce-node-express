import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic } from "./SqlWhereExprLogic";
import { FormQueryField } from "@codeffekt/ce-core-data";
import { SqlWhereBaseFactory, SqlWhereFieldCreator } from "./SqlWhereBaseFactory";
import { FormQueryUtils } from "./FormQueryUtils";
import { SqlQueryField } from "./SqlQueryField";


export class SqlWhereFactory extends SqlWhereBaseFactory {

    TYPE_TO_CREATOR = {
        "array": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromArray(qf),
        "date": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromDate(qf),
        "object": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromObject(qf),
        "integer": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "double": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "timestamp": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "text": (fac: SqlWhereFactory, qf: SqlQueryField) => fac.createFromValue(qf),        
    };    

    constructor() {
        super();
    }        

    getTableAlias(sqlField: SqlQueryField) {
        const fieldPart = sqlField.parent.type === 'or' ? sqlField.parent.id : sqlField.qf.field;
        return `q_obj_${sqlField.qf.context ? `${sqlField.qf.context}_` : ''}${fieldPart}`;
    }

    getAliasValue(sqlField: SqlQueryField) {
        // `${this.getTableAlias(qf)}.value->>'value'`;
        return FormQueryUtils.getFieldValue(sqlField.qf, this.getTableAlias(sqlField)); 
    }

    getFieldToCreator(sqlField: SqlQueryField): SqlWhereFieldCreator {
        return this.TYPE_TO_CREATOR[sqlField.qf.type ? sqlField.qf.type : "text"];
    }

    createFromArray(sqlField: SqlQueryField): SqlWhereExprElt {
        return new SqlWhereExprElt({
            field: `(${this.getTableAlias(sqlField)}->'value'->'elts' ? '${sqlField.qf.value}'`,
            op: sqlField.qf.op === "!=" ? "!=" : "=",
            value: "true)"
        });
    }     

    createFromObject(sqlField: SqlQueryField): SqlWhereExprElt {
        return new SqlWhereExprElt({
            field: `${this.getTableAlias(sqlField)}.value->'value'`,
            op: sqlField.qf.op,
            value: `'${JSON.stringify(sqlField.qf.value)}'::jsonb`
        });
    }        

    createFromNull(sqlField: SqlQueryField): SqlWhereExprLogic {
        const op = sqlField.qf.op === "!=" ? "!=" : "=";
        return new SqlWhereExprLogic({
            left: new SqlWhereExprElt({
                field: `jsonb_typeof(${this.getTableAlias(sqlField)}.value->'value')`,
                op: op === "!=" ? "!=" : "=",
                value: "'null'"
            }),
            op: op === "!=" ? "and" : "or",
            right: new SqlWhereExprElt({
                field: `(${this.getTableAlias(sqlField)}.value`,
                op: "?",
                value: `'value'=${op === "!=" ? "true" : "false"})`
            })
        });
    }    
}