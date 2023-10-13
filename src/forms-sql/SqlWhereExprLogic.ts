import { SqlWhere } from "./SqlASTTypes";

export type SqlWhereExprLogicOp = "and" | "or";

export interface SqlWhereExprLogicProps<T = string, U = string> {
    left: SqlWhere<T>;
    right: SqlWhere<U>;
    op: SqlWhereExprLogicOp;
}

export class SqlWhereExprLogic implements SqlWhereExprLogicProps {
    left: SqlWhere;
    right: SqlWhere;
    op: SqlWhereExprLogicOp;

    constructor(props: SqlWhereExprLogicProps) {
        Object.assign(this, props);
    }
}


