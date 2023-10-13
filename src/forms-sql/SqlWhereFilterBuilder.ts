import { FormFilter, InvalidParamError } from "@codeffekt/ce-core-data";
import { SqlSelect } from "./SqlSelect";
import { SqlSelectBuilder, SqlSelectBuilderOptions } from "./SqlSelectBuilder";
import { SqlWhereExprElt } from "./SqlWhereExprElt";

export interface SqlWhereFilterBuilderOptions extends SqlSelectBuilderOptions {
    filterName: string;
}

export class SqlWhereFilterBuilder {

    constructor(private options: SqlWhereFilterBuilderOptions = {
        formsTableName: "forms",
        formsRootTableName: "forms_root",
        assocsTableName: "forms_assoc",
        accountsTableName: "accounts",
        rootTableName: "forms",
        tableName: "sub",
        filterName: "filter"
    }) {}

    fromFilter(filter: FormFilter): SqlWhereExprElt<SqlSelect> {

        if(!filter.queryFields && !filter.ref && !filter.refs) {
            throw new InvalidParamError("filter.queryFields or filter.ref or filter.refs must be defined");
        }

        const selectBuilder = new SqlSelectBuilder({
            ...this.options,
            tableName: this.options.filterName
        });

        const select = filter.queryFields ? selectBuilder.fromQueryFields(filter.queryFields) : 
            selectBuilder.fromRef(filter);

        return new SqlWhereExprElt<SqlSelect>({
            field: "",
            op: filter.op === "!=" ? "not exists" : "exists",
            value: select
        });
    }
}