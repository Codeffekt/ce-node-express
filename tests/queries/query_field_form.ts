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
    queryFields: [
        {
            field: "root",
            op: "=",
            value: "trias-sample",
            onMeta: true
        },
        {
            field: "forms",
            op: "=",
            type: "form",
            value: {
                field: "drilling"
            },
        }],
};

console.log(SqlRenderer.renderSQLFromSqlAST(new FormQueryParser(queryWithRootFields).toAST()));
