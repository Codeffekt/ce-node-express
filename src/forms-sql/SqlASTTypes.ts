import { SqlWhereExprElt } from "./SqlWhereExprElt";
import { SqlWhereExprLogic } from "./SqlWhereExprLogic";

export type SqlOrderSortCriteria = "asc" | "desc";

export interface SqlOrderElt {
    field: string;
    sort: SqlOrderSortCriteria;
}

export type SqlOrder = SqlOrderElt[];

export type SqlWhere<T = string> = SqlWhereExprElt<T> | SqlWhereExprLogic;

export interface SqlSelectFieldsElt {
    field: string;
    alias?: string;
}

export type SqlSelectFields  = SqlSelectFieldsElt[];

export interface SqlFromTableProps {
    name: string;
    alias?: string;
}

export class SqlFromTable implements SqlFromTableProps {
    name: string;
    alias?: string;

    constructor(props: SqlFromTableProps) {        
        Object.assign(this, props);
    }    
}

export type SqlJoinType = "LEFT" | "RIGHT OUTER JOIN" | "FULL" | "INNER JOIN";

export interface SqlJoinElt {
    type: SqlJoinType;
    table: SqlFromTable;
    on: SqlWhere;
}

export type SqlJoins = SqlJoinElt[];

export interface SqlLimit {
    limit?: number;
    offset?: number;
}