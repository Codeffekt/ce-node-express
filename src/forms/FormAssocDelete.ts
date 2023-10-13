import { FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class FormAssocDelete {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    constructor() {
    }

    async delete(id: IndexType, indices: IndexType[], field?: IndexType) {
        const ref = FormUtils.createFormAssocRef(id, field);
        const res = await this.formsService.deleteFormsAssocIndices(ref, indices);
        return res;                
    }
}