import { FormAssoc, FormInstance, FormUtils } from "@codeffekt/ce-core-data";

export interface FormsCreationResult {
    forms: FormInstance[];
    assocs: FormAssoc[];
    res: FormInstance;
}

export function createFormExtFromArray(form: FormInstance, fields: FormInstance[]) {
    if (!fields || fields.length) {
        return form;
    }
    const requiredFields = FormUtils.getBlocksAsArray(form).filter(
        block =>
        (
            block.type === "index" &&
            block.required &&
            block.root && block.value
        )
    ).map(elt => ({
        block: elt,
        form: fields.find(f => f.id === elt.value)
    })).filter(elt => elt.form);

    return {
        ...form,
        fields: requiredFields.reduce((prev, cur) => ({ ...prev, [cur.block.field]: cur.form }), {})
    };
}
