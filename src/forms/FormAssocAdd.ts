import { FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { CeService } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class FormAssocAdd {    

    static async add(id: IndexType, indices: IndexType[], field?: string) {
        const ref = FormUtils.createFormAssocRef(id, field);
        const res = await CeService.get(FormsService).insertFormsAssoc(
            indices.map(form => ({
                form,
                ref,
            }))
        );
        return res;                
    }
}