import { FormQueryField, FormQuerySortField } from "@codeffekt/ce-core-data";

export class FormQueryUtils {

    static generateJsonPath(path: string[]) {
        const prefix = path.length > 1 ? `->${path.slice(0, path.length - 1).map(e => `'${e}'`).join('->')}` : '';
        return `${prefix}->>'${path[path.length - 1]}'`;
    }

    static getFieldValue(fq: FormQueryField | FormQuerySortField, alias: string) {
        return fq.fieldsPath && fq.fieldsPath.length ?
            `${alias}.value->'value'${FormQueryUtils.generateJsonPath(fq.fieldsPath)}` :
            `${alias}.value->>'value'`;
    }

    
}