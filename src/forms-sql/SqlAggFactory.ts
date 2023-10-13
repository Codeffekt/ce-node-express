import { FormAggField } from "@codeffekt/ce-core-data";

export class SqlAggFactory {

    FIELD_TO_CREATOR: { [op: string]: (SqlAggFactory, FormAggField, string) => string } = {
        "count": (
            fac: SqlAggFactory,
            agg: FormAggField,
            formsTableName: string) => fac.createFromCount(agg, formsTableName),
        "avg": (
            fac: SqlAggFactory,
            agg: FormAggField,
            formsTableName: string) => fac.createFromDbOp(agg, formsTableName, "avg"),
        "sum": (
            fac: SqlAggFactory,
            agg: FormAggField,
            formsTableName: string) => fac.createFromDbOp(agg, formsTableName, "sum"),
        "max": (
            fac: SqlAggFactory,
            agg: FormAggField,
            formsTableName: string) => fac.createFromDbOp(agg, formsTableName, "max"),
        "min": (
            fac: SqlAggFactory,
            agg: FormAggField,
            formsTableName: string) => fac.createFromDbOp(agg, formsTableName, "min"),
    };

    constructor() {
    }

    create(agg: FormAggField, formsTableName: string): string {
        const creator = this.FIELD_TO_CREATOR[agg.op];
        if (!creator) {
            throw new Error(`Agg factory does not support ${agg.op} for field ${agg.field}`);
        }
        return creator(this, agg, formsTableName);
    }

    createFromCount(agg: FormAggField, formsTableName: string): string {
        if (!agg.index || !agg.root) {
            throw new Error(`Count aggregation must have index and root params`);
        }
        const fValue = `f.data->'content'->'${agg.index}'->>'value'`;
        return `(select count(${fValue}) from ${formsTableName} f where ${fValue}=${formsTableName}.data->>'id' and data->>'root'='${agg.root}')`;
    }

    createFromDbOp(agg: FormAggField, formsTableName: string, op: string) {
        const fValue = `${formsTableName}.data->'content'->'${agg.index}'->>'value'`;
        return `${op}(${fValue})`;
    }
}