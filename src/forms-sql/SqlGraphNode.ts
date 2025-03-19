import { IndexType } from "@codeffekt/ce-core-data";

export interface SqlGraphNodeContext {
    field: string;
    root: string;
    alias: string;
}

export class SqlSelectGraphNode {

    static generate(context: SqlGraphNodeContext): string {
        return `(select forms.data->>'id' as id, 
            forms.data->>'root' as root, 
            forms_assoc.form as fa_form from forms, 
            forms_assoc where ref=concat('${context.field}','-',forms.data->>'id') 
            and forms.data->>'root'='${context.root}') as ${context.alias}`;
    }
}

export class SqlWhereGraphNode {
    constructor(private contexts: SqlGraphNodeContext[], private searchId: IndexType) {
    }

    generate_select(): string {
        const tables = this.generate_tables();
        const where = this.generate_where();
        return `select forms.data->>'id' as id, forms.data->'root' as root from forms, ${tables}
         where ${where}`;
    }

    private generate_tables(): string {
        const tables = this.contexts.map(ctx => SqlSelectGraphNode.generate(ctx)).join(",");
        return tables;
    }

    private generate_where(): string {
        let prev = this.contexts[0];
        let where = `forms.data->>'id'=${prev.alias}.id`;
        for (let i = 1; i < this.contexts.length - 1; ++i) {
            const current = this.contexts[i];
            where = `${where} ${prev.alias}.fa_form=${current.alias}.id`;
            prev = current;
        }
        where = `${where} and ${prev}.fa_form='${this.searchId}'`;
        return where;
    }
}