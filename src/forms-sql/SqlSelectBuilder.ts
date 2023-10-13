import { FormFilter, FormQueryField, FormQueryFieldExpr, FormQueryFieldLogic, IndexType } from "@codeffekt/ce-core-data";
import { FormQueryParserOptions } from "./FormQueryParser";
import { SqlFromTable } from "./SqlASTTypes";
import { SqlFromSelect } from "./SqlFromSelect";
import { SqlSelectProcess } from "./SqlSelectProcess";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic } from "./SqlWhereExprLogic";
import { SqlQueryField } from "./SqlQueryField";

function isFormQueryField(ref: string | FormQueryField): ref is FormQueryField {
    return (ref as FormQueryField).field !== undefined;
}

export interface SqlSelectBuilderOptions extends FormQueryParserOptions {
    tableName?: string;
}

interface RefFormValues {
    ref: string;
    form: string;
}

export class SqlSelectBuilder {

    constructor(private options: SqlSelectBuilderOptions = {
        formsTableName: "forms",
        formsRootTableName: "forms_root",
        assocsTableName: "forms_assoc",
        accountsTableName: "accounts",
        rootTableName: "forms",
        tableName: "sub"
    }) { }

    fromQueryFields(queryFields: FormQueryFieldLogic | FormQueryFieldExpr[]): SqlFromSelect {

        const select = new SqlFromSelect({
            fields: [
                {
                    field: "*"
                }
            ],
            from: [
                new SqlFromTable({
                    name: this.options.formsTableName,
                    alias: this.options.tableName
                })
            ]
        });

        const process = new SqlSelectProcess({
            ...this.options,
            select
        });

        const rootExpr = Array.isArray(queryFields) ? {
            and: queryFields
        } : queryFields || { and: [] };

        process.addFormQueryFields(rootExpr);

        return select;
    }

    fromRef(query: FormFilter): SqlFromSelect {

        const select = new SqlFromSelect({
            fields: [
                {
                    field: "*"
                }
            ],
            from: [
                new SqlFromTable({
                    name: this.options.assocsTableName,
                })
            ]
        });

        const refFormValues = query.ref ?
            this.getRefFormValuesFromRef(query.ref) :
            this.getRefFormValuesFromRefs(query.refs);        

        select.setWhereRoot(new SqlWhereExprLogic({
            left: new SqlWhereExprElt({
                field: `${this.options.assocsTableName}.ref`,
                op: "=",
                value: refFormValues.ref
            }),
            op: "and",
            right: new SqlWhereExprElt({
                field: `${this.options.assocsTableName}.form`,
                op: "=",
                value: refFormValues.form
            })
        }));

        return select;
    }

    fromContext(context: string) {        
        return new SqlFromSelect({
            fields: [
                {
                    field: "data"
                }
            ],
            from: [
                new SqlFromTable({
                    name: this.options.formsTableName
                })
            ],
            alias: `${this.options.formsTableName}_${context}`
        });
    }

    fromFormAssoc(sqlField: SqlQueryField) {

        const formAssocsAlias = this.getTableAlias(sqlField);

        return new SqlFromSelect({
            fields: [
                {
                    field: "*"
                }
            ],
            from: [
                new SqlFromTable({
                    name: this.options.assocsTableName,                    
                })
            ],
            alias: formAssocsAlias
        });
    }

    private getTableAlias(sqlField: SqlQueryField) {
        const fieldPart = sqlField.parent.type === 'or' ? sqlField.parent.id : sqlField.qf.field;
        return `${this.options.tableName ?? this.options.assocsTableName}_${sqlField.qf.field}`;
    }

    private getRefFormValuesFromRef(ref: string | FormQueryField<string>): RefFormValues {
        return isFormQueryField(ref) ?
            {
                ref: this.getRefValueFromQueryField(ref),
                form: `'${ref.value}'` ?? this.getIdValue()
            }
            : {
                ref: `'${ref}'`,
                form: this.getIdValue()
            };
    }

    private getRefFormValuesFromRefs(refs: string[]): RefFormValues {
        return {
            ref: `ANY(ARRAY[${refs.map(idx => `'${idx}'`).join(",")}]::text[])`,
            form: this.getIdValue()
        };
    }

    private getIdValue() {
        return `${this.options.formsTableName}.data->>'id'`;
    }

    private getRefValueFromQueryField(ref: FormQueryField<string>): string {
        return ref.onMeta ? 
        `concat('${ref.field}','-',${this.options.formsTableName}.data->>'id')` :
        `${this.options.formsTableName}.data->'content'->'${ref.field}'->>'value'`
    }
}