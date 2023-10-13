import { SqlWhere } from "./SqlASTTypes";
import { FormQueryField, FormQueryFieldDateOp, FormQueryFieldType } from "@codeffekt/ce-core-data";
import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic } from "./SqlWhereExprLogic";
import * as moment from "moment";
import { Moment } from "moment";
import { SqlQueryField } from "./SqlQueryField";

export type SqlWhereFieldCreator = (fac: SqlWhereBaseFactory, sqlField: SqlQueryField) => SqlWhereExprElt;

export abstract class SqlWhereBaseFactory {

    QUERY_FIELD_TYPE_MAP = {
        "integer": "INTEGER",
        "double": "NUMERIC",
        "timestamp": "BIGINT",
        "date": "BIGINT",
        "array": undefined as string,
        "object": undefined as string,
        "text": undefined as string
    };

    RANGE_OPS = ["[]", "]]", "][", "[["];

    constructor() {
    }

    create(sqlField: SqlQueryField): SqlWhere {
        if (sqlField.qf.value !== null && sqlField.qf.value !== undefined) {
            const creator = this.getFieldToCreator(sqlField);
            if (!creator) {
                throw new Error(`Invalid query field ${JSON.stringify(sqlField.qf)}`);
            }
            return creator(this, sqlField);
        } else if (sqlField.qf.values !== undefined && sqlField.qf.values.length) {
            return this.createFromValues(sqlField);
        } else {
            return this.createFromNull(sqlField);
        }
    }

    getFieldType(type: FormQueryFieldType) {
        return this.QUERY_FIELD_TYPE_MAP[type];
    }

    createFromValues(sqlField: SqlQueryField): SqlWhereExprElt | SqlWhereExprLogic {
        if (this.RANGE_OPS.includes(sqlField.qf.op)) {
            return this.createFromValuesRange(sqlField);
        }

        const joinValues =
            typeof sqlField.qf.values[0] === 'string' ? 
            `('${sqlField.qf.values.join("','")}')` : 
            `(${sqlField.qf.values.join(',')})`;

        return new SqlWhereExprElt({
            field: this.getAliasValue(sqlField),
            op: sqlField.qf.op === "!=" ? "not in" : "in",
            value: joinValues
        });
    }

    createFromValuesRange(sqlField: SqlQueryField): SqlWhereExprLogic {
        return new SqlWhereExprLogic({
            left: this.createFromValue({
                ...sqlField,
                qf: {
                    ...sqlField.qf,
                    op: sqlField.qf.op === "[[" || sqlField.qf.op === "[]" ? ">=" : ">",
                    value: sqlField.qf.values[0]
                }
            }),
            op: "and",
            right: this.createFromValue({
                ...sqlField,
                qf: {
                    ...sqlField.qf,
                    op: sqlField.qf.op === "[]" || sqlField.qf.op === "]]" ? "<=" : "<",
                    value: sqlField.qf.values[1]
                }
            }),
        });
    }

    createFromValue(sqlField: SqlQueryField): SqlWhereExprElt {
        const fieldType = this.getFieldType(sqlField.qf.type);
        return new SqlWhereExprElt({
            field: fieldType ? `(${this.getAliasValue(sqlField)})::${fieldType}` : `${this.getAliasValue(sqlField)}`,
            op: sqlField.qf.op ? sqlField.qf.op : "=",
            value: `'${sqlField.qf.value}'`
        });
    }

    createFromDate(sqlField: SqlQueryField): SqlWhereExprElt {
        const value = sqlField.qf.value as any;
        return this.createFromValue({
            ...sqlField,
            qf: {
                ...sqlField.qf,
                value: this.isQueryFieldDateOp(value) ?
                    this.createValueFromDateOps(value) :
                    this.createValueFromDate(value)
            }
        });
    }

    createValueFromDateOps(dateOp: FormQueryFieldDateOp) {
        const mDate = this.applyQueryFieldDateOpFunctor(
            this.applyQueryFieldDateOpStartOf(moment.utc(), dateOp),
            dateOp);
        return mDate.valueOf().toString();
    }

    createValueFromDate(dateValue: string | number) {
        return moment.utc(dateValue).valueOf().toString();
    }

    isQueryFieldDateOp(value: any) {
        return value?.op || value?.startOf;
    }

    applyQueryFieldDateOpFunctor(mDate: Moment, dateOp: FormQueryFieldDateOp) {
        if (!dateOp.op) {
            return mDate;
        }
        const functor = dateOp.op === "-" ? mDate.subtract.bind(mDate) : mDate.add.bind(mDate);
        return functor(dateOp.duration, dateOp.unit);
    }

    applyQueryFieldDateOpStartOf(mDate: Moment, dateOp: FormQueryFieldDateOp) {
        return dateOp?.startOf ? mDate.startOf(dateOp.startOf) : mDate;
    }

    abstract getTableAlias(qf: SqlQueryField);

    abstract getAliasValue(qf: SqlQueryField);

    abstract getFieldToCreator(qf: SqlQueryField): SqlWhereFieldCreator;

    abstract createFromNull(qf: SqlQueryField): SqlWhereExprElt | SqlWhereExprLogic;
}