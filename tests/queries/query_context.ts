import { SqlRenderer } from "../../src/forms-sql/SqlRenderer";
import { FormQueryParser } from "../../src/forms-sql/FormQueryParser";
import { FormQuery } from "@codeffekt/ce-core-data";

const queryBase: FormQuery = {
    limit: 10,
    offset: 0,
    formRoot: "forms-drilling-sample",
    extMode: true
};

const queryWithSortFields: FormQuery = {
    ...queryBase,    
    queryFields: [
        {            
            context: "drilling",            
            field: "name",
            op: "="        
        }
    ]
};

console.log(SqlRenderer.renderSQLFromSqlAST(new FormQueryParser(queryWithSortFields).toAST()));
