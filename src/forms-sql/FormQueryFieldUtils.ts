import { FormQueryField, FormQueryFieldExpr, FormQueryFieldLogic, FormUtils } from "@codeffekt/ce-core-data";
import { SqlQueryField, SqlQueryFieldParent, SqlQueryFieldUtils } from "./SqlQueryField";

export class FormQueryFieldUtils {

    static isFormQueryField(qf: FormQueryFieldExpr): qf is FormQueryField {
        return (qf as FormQueryField).field !== undefined;
    }

    static isFormQueryFieldOnMeta(qf: FormQueryFieldExpr): qf is FormQueryField & { onMeta: true } {
        return (qf as FormQueryField).onMeta;
    }

    static isFormQueryFieldContext(qf: FormQueryFieldExpr): qf is FormQueryField & { context: string } {
        return (qf as FormQueryField).context !== undefined;
    }

    static isFormQueryFieldLogicAnd(qf: FormQueryFieldExpr): qf is FormQueryFieldLogic & { and: FormQueryFieldExpr[], or: undefined } {
        return (qf as FormQueryFieldLogic).and !== undefined;
    }

    static isFormQueryFieldLogicOr(qf: FormQueryFieldExpr): qf is FormQueryFieldLogic & { or: FormQueryFieldExpr[], and: undefined } {
        return (qf as FormQueryFieldLogic).or !== undefined;
    }

    static isFormAssocType(qf: FormQueryField): boolean {
        return qf.type === "formAssoc";
    }

    static isFormType(qf: FormQueryField): boolean {
        return qf.type === "form";
    }

    static getUniquesFieldsFromQueryFieldExpr(queryFieldExpr: FormQueryFieldExpr, fields: SqlQueryField[], parent: SqlQueryFieldParent): SqlQueryField[] {

        if (this.isFormQueryFieldOnMeta(queryFieldExpr) && !this.isFormAssocType(queryFieldExpr)) {
            return fields;
        }

        if (this.isFormQueryFieldLogicAnd(queryFieldExpr)) {
            for (const qf of queryFieldExpr.and) {
                this.getUniquesFieldsFromQueryFieldExpr(qf, fields, {
                    type: 'and',
                    id: `${parent.id}_and`
                });
            }

        } else if (this.isFormQueryFieldLogicOr(queryFieldExpr)) {
            for (const qf of queryFieldExpr.or) {
                this.getUniquesFieldsFromQueryFieldExpr(qf, fields, {
                    type: 'or',
                    id: `${parent.id}_or`
                });
            }
        } else if (
            this.isFormQueryField(queryFieldExpr) &&
            !fields.find(
                (field) => FormUtils.haveSameField(field.qf, queryFieldExpr) ||
                    SqlQueryFieldUtils.isSameParent(field.parent, parent)
            )
        ) {
            fields.push({
                qf: queryFieldExpr,
                parent
            });
        }
        return fields;
    }
}