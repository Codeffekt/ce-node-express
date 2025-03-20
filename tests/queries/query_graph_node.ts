import { SqlGraphNodeContext, SqlWhereGraphNode } from "../../src/forms-sql/SqlGraphNode";

const context: SqlGraphNodeContext[] = [
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

);