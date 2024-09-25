import { FormAssoc } from "@codeffekt/ce-core-data";
import format = require("pg-format");
import { DbTablesOption } from "../core";

export class SqlInsertBuilder {    

    static fromFormAssoc(assoc: FormAssoc, options: DbTablesOption) {
        return this.fromFormsAssoc([assoc], options);        
    }

    static fromFormsAssoc(elts: FormAssoc[], options: DbTablesOption) {        
        const query = format(
            `insert into ${options.assocsTableName} (ref,form) values %L on conflict(ref,form) do nothing`, 
            elts.map(elt => [elt.ref, elt.form]));
        return query;
    }
}