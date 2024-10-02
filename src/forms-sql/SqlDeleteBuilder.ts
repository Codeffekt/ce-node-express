import { FormAssoc, IndexType } from "@codeffekt/ce-core-data";
import format = require("pg-format");
import { DbTablesOption } from "../core";

export class SqlDeleteBuilder {    

    static fromFormAssoc(assoc: FormAssoc, options: DbTablesOption) {
        return format(
            `delete from ${options.assocsTableName} where ref=%L and form=%L`,
            assoc.ref, assoc.form);         
    }

    static fromFormsAssoc(elts: FormAssoc[], options: DbTablesOption) {        
        return format(
            `delete from ${options.assocsTableName} where (ref, form) in (%L)`, 
            elts.map(elt => [elt.ref, elt.form]));
    }

    static fromFormAssocRef(ref: IndexType, options: DbTablesOption) {        
        return format(
            `delete from ${options.assocsTableName} where ref=%L`, ref);
    }

    static fromFormAssocForm(form: IndexType, options: DbTablesOption) {
        return format(
            `delete from ${options.assocsTableName} where form=%L`, form);
    }

    static fromFormAssocIndices(ref: IndexType, indices: IndexType[], options: DbTablesOption) {
        const values = indices.map(elt => `'${elt}'`).join(',');
        return format(`delete from forms_assoc where ref=%L and form=ANY(ARRAY[${values}]::text[])`, 
            [ref]);        
    }
}