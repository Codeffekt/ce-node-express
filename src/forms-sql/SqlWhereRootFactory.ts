import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereBaseFactory, SqlWhereFieldCreator } from "./SqlWhereBaseFactory";
import { FormQueryUtils } from "./FormQueryUtils";
import { SqlQueryField } from "./SqlQueryField";


export class SqlWhereRootFactory extends SqlWhereBaseFactory {

    FIELD_TO_CREATOR = {
        "ctime": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValueOrDate(qf),
        "mtime": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValueOrDate(qf),
        "id": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "title": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "author": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "root": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "table": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValue(qf),
        "valid": (fac: SqlWhereRootFactory, qf: SqlQueryField) => fac.createFromValue(qf),        
    };

    constructor() {
        super();
    }

    getTableAlias(sqlField: SqlQueryField) {
        return sqlField.qf.context;
    }

    getAliasValue(sqlField: SqlQueryField) {
        const tableAlias = this.getTableAlias(sqlField);
        const dataPath = tableAlias ? `${tableAlias}.data` : "data";
        return sqlField.qf.fieldsPath?.length ? `${dataPath}->'${sqlField.qf.field}'${FormQueryUtils.generateJsonPath(sqlField.qf.fieldsPath)}` 
        : `${dataPath}->>'${sqlField.qf.field}'`;
    }

    getFieldToCreator(sqlField: SqlQueryField): SqlWhereFieldCreator {
        const creator = this.FIELD_TO_CREATOR[sqlField.qf.field];
        return creator || ((fac, sqlField) => fac.createFromValue(sqlField));        
    }

    createFromNull(sqlField: SqlQueryField): SqlWhereExprElt {
        const op = sqlField.qf.op === "!=" ? "!=" : "=";
        return new SqlWhereExprElt({
            field: `${this.getAliasValue(sqlField)}`,
            op: op === "!=" ? "is not" : "is",
            value: " null"
        });
    } 
    
    createFromValueOrDate(sqlField: SqlQueryField) {
        if(sqlField.qf.type !== "date") {
            return this.createFromValue(sqlField);
        } else {
            return this.createFromDate(sqlField);
        }
    }
}