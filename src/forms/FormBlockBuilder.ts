import { FormBlock, FormBlockType, FormCreator } from "@codeffekt/ce-core-data";

export class FormBlockBuilder {

    private constructor() {}    

    static asTextFromObj<T>(obj: T, field: keyof T, label: string): FormBlock {
        return this.asTypeFromObj<T>(obj, field, label, "text");
    }

    static asObjectFromObj<T>(obj: T, field: keyof T, label: string): FormBlock {
        return this.asTypeFromObj<T>(obj, field, label, "object");
    }    

    static asTypeFromObj<T>(obj: T, field: keyof T, label: string, type: FormBlockType) {
        return {
            label: label,
            type: type,
            field: field as string,
            value: obj[field]
        };
    }

    static asFormArrayFromAssoc(assoc: FormCreator): FormBlock {
        return {
            root: assoc.root,
            type: "formArray",
            field: assoc.id,
            label: assoc.id,
            value: [],
            params: {
                ref: assoc.ref,
                fields: (<any>assoc).fields || [
                ],
                extMode: (<any>assoc).extMode ? true : false,
                scope: "global",
                usedHasParams: assoc.usedHasParams,
            }
        };
    }
}