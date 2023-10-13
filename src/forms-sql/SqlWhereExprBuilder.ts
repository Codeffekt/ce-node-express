import { FormQueryField, FormQueryFieldAssoc, FormQueryFieldExpr, FormQueryFieldParent } from "@codeffekt/ce-core-data";
import { FormQueryFieldUtils } from "./FormQueryFieldUtils";
import { SqlWhere } from "./SqlASTTypes";
import { SqlSelectBuilderOptions } from "./SqlSelectBuilder";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic, SqlWhereExprLogicOp } from "./SqlWhereExprLogic";
import { SqlWhereFactory } from "./SqlWhereFactory";
import { SqlWhereRootFactory } from "./SqlWhereRootFactory";
import { SqlQueryField, SqlQueryFieldParent } from "./SqlQueryField";

export class SqlWhereExprBuilder {

    private exprFactory: SqlWhereFactory = new SqlWhereFactory();
    private exprRootFactory: SqlWhereRootFactory = new SqlWhereRootFactory();

    constructor(private options: SqlSelectBuilderOptions) { }

    fromContext(context: string) {
        return new SqlWhereExprElt({
            field: `${this.options.rootTableName}_${context}.data->>'id'`,
            op: "=",
            value: `${this.options.rootTableName}.data->'content'->'${context}'->>'value'`
        });
    }

    fromQueryFieldExpr(queryFieldExpr: FormQueryFieldExpr, parent: SqlQueryFieldParent) {
        if (FormQueryFieldUtils.isFormQueryFieldLogicAnd(queryFieldExpr)) {
            return this.fromQueryFieldArray(queryFieldExpr.and, "and", { type: 'and', id: `${parent.id}_and` });
        } else if (FormQueryFieldUtils.isFormQueryFieldLogicOr(queryFieldExpr)) {
            return this.fromQueryFieldArray(queryFieldExpr.or, "or", { type: 'or', id: `${parent.id}_or` });
        } else {
            return this.fromQueryField({
                qf: queryFieldExpr as FormQueryField,
                parent,
            });
        }
    }

    fromQueryFieldArray(queryFields: FormQueryFieldExpr[], op: SqlWhereExprLogicOp, parent: SqlQueryFieldParent): SqlWhere {
        if (!queryFields.length) {
            return undefined;
        }

        if (queryFields.length === 1) {
            return this.fromQueryFieldExpr(queryFields[0], parent);
        }

        return new SqlWhereExprLogic({
            left: this.fromQueryFieldExpr(queryFields[0], parent),
            op,
            right: this.fromQueryFieldArray(queryFields.slice(1), op, parent)
        });
    }

    fromQueryField(sqlField: SqlQueryField): SqlWhere {        
        const qfContext = this.options.tableName ? {
            ...sqlField,
            qf: {
                ...sqlField.qf, context: this.options.tableName
            }
        } : sqlField;

        if (FormQueryFieldUtils.isFormAssocType(sqlField.qf)) {
            return this.fromAssoc(sqlField);
        } else {
            return sqlField.qf.onMeta ? this.fromQueryRootField(sqlField) : new SqlWhereExprLogic({
                left: new SqlWhereExprElt({
                    field: `${this.exprFactory.getTableAlias(qfContext)}.key`,
                    op: '=',
                    value: `'${sqlField.qf.field}'`
                }),
                op: "and",
                right: FormQueryFieldUtils.isFormType(sqlField.qf) ? this.fromForm(sqlField) : this.exprFactory.create(qfContext)
            });
        }
    }

    fromQueryRootField(sqlField: SqlQueryField): SqlWhere {
        return this.exprRootFactory.create({
            ...sqlField,
            qf: {
                ...sqlField.qf,
                context: this.options.tableName || this.options.rootTableName
            }
        });
    }

    fromForm(sqlField: SqlQueryField): SqlWhere {

        const value = sqlField.qf.value as FormQueryFieldParent;

        const field = value.onMeta ? this.exprRootFactory.getAliasValue({
            ...sqlField,
            qf: {
                context: this.options.formsTableName,
                field: value.field,
            }
        }) : this.exprRootFactory.getAliasValue({
            ...sqlField,
            qf: {
                context: this.options.formsTableName,
                field: "content",
                fieldsPath: [value.field, "value"]
            }
        });

        return new SqlWhereExprElt({
            field: `${this.exprFactory.getTableAlias({
                ...sqlField,
                qf: {
                    ...sqlField.qf,
                    context: this.options.tableName
                }
            })}.value->>'value'`,
            op: sqlField.qf.op,
            value: field
        });
    }

    fromAssoc(sqlField: SqlQueryField): SqlWhere {

        const value = sqlField.qf.value as FormQueryFieldAssoc;

        const formAssocsAlias = `${this.options.tableName ?? this.options.assocsTableName}_${sqlField.qf.field}`;

        const field = sqlField.qf.values !== undefined ? this.getValuesFromQueryField(sqlField.qf)
            : this.getValueFromQueryFieldAssoc(value);

        const refValue = value.refs !== undefined ?
            this.getRefFormValuesFromRefs(value.refs) :
            value.ref !== undefined ? `'${value.ref}'` : this.getRefValueFromQueryField(sqlField.qf);



        return new SqlWhereExprLogic({
            left: new SqlWhereExprElt({
                field: `${formAssocsAlias}.ref`,
                op: "=",
                value: refValue
            }),
            op: "and",
            right: new SqlWhereExprElt({
                field: `${formAssocsAlias}.form`,
                op: sqlField.qf.op,
                value: field
            })
        });
    }

    private getValueFromQueryFieldAssoc(qfa: FormQueryFieldAssoc) {
        if (qfa.field) {
            return qfa.onMeta ? this.exprRootFactory.getAliasValue({
                parent: {
                    id: 'root'
                },
                qf: {
                    context: this.options.formsTableName,
                    field: qfa.field,
                }
            }) : this.exprRootFactory.getAliasValue({
                parent: {
                    id: 'root'
                },
                qf: {
                    context: this.options.formsTableName,
                    field: "content",
                    fieldsPath: [qfa.field, "value"]
                }
            });
        } else {
            return `'${qfa.value}'`;
        }
    }

    getValuesFromQueryField(qf: FormQueryField) {
        return `ANY(ARRAY[${qf.values.map(idx => `'${idx}'`).join(",")}]::text[])`;
    }

    private getRefFormValuesFromRefs(refs: string[]): string {
        return `ANY(ARRAY[${refs.map(idx => `'${idx}'`).join(",")}]::text[])`;
    }

    private getRefValueFromQueryField(ref: FormQueryField): string {
        return ref.onMeta ?
            `concat('${ref.field}','-',${this.options.tableName ?? this.options.formsTableName}.data->>'id')` :
            `${this.options.tableName ?? this.options.formsTableName}.data->'content'->'${ref.field}'->>'value'`
    }
}