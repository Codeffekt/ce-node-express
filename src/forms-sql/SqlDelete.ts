import { SqlFromTable } from "./SqlASTTypes";

export interface SqlDeleteProps {
    into: SqlFromTable;
}

export class SqlInsert implements SqlDeleteProps {

    into: SqlFromTable;
    

    constructor(props: SqlDeleteProps) {        
        Object.assign(this, props);
    }  
}