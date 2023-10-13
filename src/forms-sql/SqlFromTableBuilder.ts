import { SqlFromTable } from "./SqlASTTypes";
import { SqlSelectBuilderOptions } from "./SqlSelectBuilder";
import { SqlQueryField } from "./SqlQueryField";

export class SqlFromTableBuilder {

    constructor(private options: SqlSelectBuilderOptions) { }

    fromQueryField(field: SqlQueryField): SqlFromTable {
        return this.createFormTable(field);
    }

    private getTableContent(context?: string) {
        return `jsonb_each(${this.getDataField(context)}#>'{content}')`;
    }

    private getDataField(context?: string) {
        return `${this.options.tableName || this.options.rootTableName}${context ? `_${context}` : ''}.data`;
    }

    private getTableAlias(sqlField: SqlQueryField) {
        const fieldPart = sqlField.parent.type === 'or' ? sqlField.parent.id : sqlField.qf.field;
        return `q_obj_${sqlField.qf.context ? `${sqlField.qf.context}_` : ''}${fieldPart}`;
    }

    private createFormTable(field: SqlQueryField): SqlFromTable {        
        return new SqlFromTable({
            name: this.getTableContent(field.qf.context),
            alias: this.getTableAlias({
                ...field,
                qf: {
                    ...field.qf,
                    context: field.qf.context ?? this.options.tableName
                }
            })
        });
    }
}