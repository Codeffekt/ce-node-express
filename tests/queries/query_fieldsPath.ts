import { SqlRenderer } from "../../src/forms-sql/SqlRenderer";
import { FormQueryParser } from "../../src/forms-sql/FormQueryParser";
import { FormQuery } from "@codeffekt/ce-core-data";

const queryBase: FormQuery = {
    limit: 10,
    offset: 0,    
    extMode: true
};

const queryWithSortFields: FormQuery = {
    ...queryBase,
    queryFields: [
        {
            field: "root",
            op: "=",
            value: "forms-drilling-sample",
            onMeta: true
        },
        {            
            field: "context",
            fieldsPath: ["amenagements", "couts"],
            op: "=",
            value: 2500,
            type: "double"
        },
        {
            field: "version",
            fieldsPath: ["head"],
            op: "=",
            value: "forms-drilling-final",
            onMeta: true
        }
    ]
};

console.log(SqlRenderer.renderSQLFromSqlAST(new FormQueryParser(queryWithSortFields).toAST()));
