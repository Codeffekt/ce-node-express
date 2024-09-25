import { SqlFromTable } from "./SqlASTTypes";

export interface SqlInsertProps {
    into: SqlFromTable;
}

export class SqlInsert implements SqlInsertProps {

    into: SqlFromTable;
    

    constructor(props: SqlInsertProps) {        
        Object.assign(this, props);
    }  
}