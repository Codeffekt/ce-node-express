import { SqlRenderer } from "../../src/forms-sql/SqlRenderer";
import { FormQuery } from "@codeffekt/ce-core-data";
import { FormQueryParser } from "../../src/forms-sql/FormQueryParser";

const queryBase: FormQuery = {
    limit: 10,
    offset: 0,
    extMode: false
};

const queryWithRootFields: FormQuery = {
    ...queryBase,
    queryFields: [{
        field: "samples",
        op: "=",
        type: "formAssoc",
        onMeta: true,
        value: {
            value: "96dd8560-7d04-4537-a1ed-65936eb4bc10"            
        }
    }],   
};

console.log(SqlRenderer.renderSQLFromSqlAST(new FormQueryParser(queryWithRootFields).toAST()));
