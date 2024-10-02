import { FormBlock, FormInstance, FormWrapper, IndexType } from "@codeffekt/ce-core-data";


export class ForkFieldsUtils {
    static removeFieldPath(field: IndexType, fields?: string[]) {
        if (!fields) {
            return undefined;
        }

        const subFields = fields.filter(f => f.startsWith(`${field}.`));

        const re = new RegExp(`^${field}\\.`);
        return subFields.map(f => f.replace(re, ""));
    }

    static copyPredicate(src: FormInstance, dst: FormInstance, predicate: (block: FormBlock) => boolean) {
        Object.values(src.content)
            .filter(predicate)
            .forEach(block =>
                FormWrapper.setFormValue(
                    block.field,
                    FormWrapper.getFormValue(
                        block.field,
                        src
                    ),
                    dst
                )
            );
    }

    static getPredicateWithFields(includesFields: string[], excludesFields: string[]) {
        return (block: FormBlock) => (
            (!includesFields && !excludesFields) ||
            (includesFields && includesFields.includes(block.field)) ||
            (!excludesFields || !excludesFields.includes(block.field))
        );
    }

    static getPredicateWithNonRequired() {
        return (block: FormBlock) => (
            block.type !== "index" || (block.type === "index" && !block.required)
        );
    }

    static getPredicateArray() {
        return (block: FormBlock) => (
            (block.type === "formArray") && (block.root)
        );
    }

    static getPredicateAssoc() {
        return (block: FormBlock) => (
            (block.type === "formAssoc") && (block.root)
        );
    }

    static syncForms(src: FormInstance, dst: FormInstance, includesFields: string[], excludesFields: string[]) {
        const predWithFields = ForkFieldsUtils.getPredicateWithFields(includesFields, excludesFields);
        const predNonRequired = ForkFieldsUtils.getPredicateWithNonRequired();
        ForkFieldsUtils.copyPredicate(src, dst, (block) => predNonRequired(block) && predWithFields(block));
    }
}