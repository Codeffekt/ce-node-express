import { FORM_BLOCK_TYPE_INDEX, FormBlockType, IndexType } from "@codeffekt/ce-core-data";

export class SqlUpdate {

    private constructor(private type: FormBlockType, private values: IndexType[]) {}

    static clearFromBlock(type: FormBlockType, values: IndexType[]) {
        const updater = new SqlUpdate(type, values);
        return updater.createUpdateSetExpr();
    }

    private createUpdateSetExpr() {
        
        if(!this.values.length) {
            return;
        }

        if(this.type !== FORM_BLOCK_TYPE_INDEX && this.type !== "asset") {
            throw new Error("SqlUpdate only support index or asset block type");
        }        

        const condExpr = this.type == FORM_BLOCK_TYPE_INDEX ? 
            this.createValueContentFromIndex() : this.createValueContentFromAsset();

        const blocksQuery = `select data->'id' as id, blocks.key as field from forms, 
        jsonb_each(forms.data->'content') as blocks
        where blocks.value->>'type'='${this.type}' and
        ${condExpr}=ANY(ARRAY[${this.values.map(m => `'${m}'`).join(',')}]::text[])`;    

        const setExpr = `data = jsonb_set(data, array['content', up_forms.field, 'value'], 'null', false)`;

        const updateQuery = `update forms set ${setExpr} from (${blocksQuery}) as up_forms 
        where forms.data->'id' = up_forms.id`

        return updateQuery;
    }

    private createValueContentFromIndex() {
        return "blocks.value->>'value'";
    }

    private createValueContentFromAsset() {
        return "blocks.value->'value'->>'id'";
    }
}