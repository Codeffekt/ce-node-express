import { SqlRenderer } from "../../src/forms-sql/SqlRenderer";
import { FormQuery } from "@codeffekt/ce-core-data";
import { FormQueryParser } from "../../src/forms-sql/FormQueryParser";
import { DB_TABLE_ACCOUNTS, DB_TABLE_FORMS, DB_TABLE_FORMSROOT, DB_TABLE_FORMSROOT_ASSOC } from "../../src/core/Db";

const queryBase: FormQuery = {
    limit: 10,
    offset: 0,
    extMode: false
};

const queryWithRootFields: FormQuery = {
    ...queryBase,
    queryFields: [{
        field: "forms",
        op: "=",
        type: "formAssoc",
        onMeta: true,
        value: {
            value: "96dd8560-7d04-4537-a1ed-65936eb4bc10"            
        }
    }],   
};

console.log(SqlRenderer.renderSQLFromSqlAST(new FormQueryParser(queryWithRootFields, {
    formsTableName: DB_TABLE_FORMS, 
    formsRootTableName: DB_TABLE_FORMSROOT,
    assocsTableName: DB_TABLE_FORMSROOT_ASSOC,
    accountsTableName: DB_TABLE_ACCOUNTS,
    rootTableName: DB_TABLE_FORMSROOT, 
}).toAST()));
