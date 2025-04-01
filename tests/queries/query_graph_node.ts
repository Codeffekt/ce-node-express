import { SqlRenderer } from "../../src/forms-sql/SqlRenderer";
import { FormQueryParser } from "../../src/forms-sql/FormQueryParser";
import { FormQuery } from "@codeffekt/ce-core-data";

/* const context: SqlGraphNodeContext[] = [
    {
        field: 'samples',
        root: 'trias-drilling',
        alias: 'tb_drillings'
    },
    {
        field: 'drillings',
        root: 'trias-project',
        alias: 'tb_project'
    }
];

const graphNode = new SqlWhereGraphNode(
    context,
    "195df0ef-9ab4-4d6a-8797-0c74ec9a0e59"
);

console.log(

    graphNode.generate_select()

); */

const queryBase: FormQuery = {
    limit: 10,
    offset: 0,
    extMode: false
};

const queryWithNodes: FormQuery = {
    ...queryBase,
    queryFields: [
        {
            field: "root",
            op: "=",
            value: "trias-sample",
            onMeta: true
        },
    ],
    nodes: [
        {
            field: "drillings",
            root: "trias-project",
            name: "project"
        },
        {
            field: "samples",
            root: "trias-drilling",
            name: "drilling"
        }
    ]
};

console.log(SqlRenderer.renderSQLFromSqlAST(new FormQueryParser(queryWithNodes).toAST()));