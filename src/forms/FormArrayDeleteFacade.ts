import { FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { CeService } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class FormArrayDeleteFacade {

    static async execute(id: IndexType, arrayField: string) {
        const formsService = CeService.get(FormsService);

        const ref = FormUtils.createFormAssocRef(id, arrayField);

        await formsService.deleteFormsQuery({
            ref
        });

        await formsService.deleteFormsAssoc(ref);

        return true;
    }

    static async deleteSubForms(id: IndexType, arrayField: string, subFormField: string) {
        const formsService = CeService.get(FormsService);

        const ref = FormUtils.createFormAssocRef(id, arrayField);

        await formsService.deleteFormsQuery({
            filters: [{
                ref,
                op: "=",
                queryFields: [{
                    field: subFormField,
                    op: "=",
                    type: "form",
                    value: {
                        field: "id",
                        onMeta: true
                    }
                }]
            }]
        });
    }
}