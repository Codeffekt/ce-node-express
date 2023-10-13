import { FormQueryFieldOp } from "@codeffekt/ce-core-data";


export type SqlWhereExprEltOp = FormQueryFieldOp | "not in" | "in" | "?" | "is" | "is not" | "exists" | "not exists";

export interface SqlWhereExprEltProps<T = string> {
    field: string;
    op: SqlWhereExprEltOp;
    value: T;
}

export class SqlWhereExprElt<T = string> implements SqlWhereExprEltProps<T> {
    field: string;
    op: SqlWhereExprEltOp;
    value: T;

    constructor(props: SqlWhereExprEltProps<T>) {
        Object.assign(this, props);
    }
}
