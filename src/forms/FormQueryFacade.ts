
import { FormInstance, FormInstanceExt, IndexType, FormQuery } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormsQueryBaseFacade } from "./FormQueryBaseFacade";

export class FormQueryFacade extends FormsQueryBaseFacade {

    @Inject(FormsService)
    private readonly forms: FormsService;

    private form: FormInstance | FormInstanceExt;

    constructor(pid: IndexType, private id: IndexType, query: FormQuery, table?: IndexType) {
        super(pid, query, table || query.table);
    }

    async execute() {        
        await super.executeCommon();
        return this.form;
    }

    protected async runQuery() {
        this.form = await this.forms.getFormQuery(this.id, this.query);
    }
}