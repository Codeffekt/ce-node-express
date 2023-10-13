import { FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class FormAssocAdd {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    constructor() {
    }

    async add(id: IndexType, indices: IndexType[], field?: string) {
        const ref = FormUtils.createFormAssocRef(id, field);
        const res = await this.formsService.insertFormsAssoc(
            indices.map(form => ({
                form,
                ref,
            }))
        );
        return res;                
    }
}