import { FormQuery, FormQueryField } from "@codeffekt/ce-core-data";

export class InitialFormQueryParser {

    static renderSQLFromFormQuery(query: FormQuery) {
        return this.getFormsQuery(query);
    }

    static getFormsQuery(queryParam: FormQuery): string {

        const query = { limit: 0, offset: 0, ...queryParam };

        const qf_select_part = `select count(*) over() as total, forms.data as data`;
        const qf = this.generate_query_fields(query, "forms");

        let select_part = "select forms.total as total, forms.data as data";
        let from_part = `from (${qf_select_part} ${qf}) forms`;
        let where_part = "";

        if (query.extMode) {
            select_part += "," + " f_obj.key as f_name, f_obj.value->>'value' as f_value, f_forms.data as f_form";
            from_part += "," + "forms as f_forms right outer join jsonb_each(forms.data#>'{content}') f_obj on (f_forms.data->>'id'=f_obj.value->>'value')";
            where_part += "where f_obj.value->>'type'='index'";
        }

        const queryDB = select_part + " " + from_part + " " + where_part;

        return queryDB;
    }

    static generate_query_field(qf: FormQueryField): string {
        if (qf.value !== null && qf.value !== undefined) {
            if (qf.type === "array") {
                const op = qf.op === "!=" ? "!=" : "=";
                return `q_obj_${qf.field}.key='${qf.field}' and (q_obj_${qf.field}.value->'value'->'elts' ? '${qf.value}'${op}true)`;
            } else {
                const op = qf.op ? qf.op : "=";
                return `q_obj_${qf.field}.key='${qf.field}' and q_obj_${qf.field}.value->>'value'${op}'${qf.value}'`;
            }
        } else if (qf.values !== undefined && qf.values.length) {
            const op = qf.op === "!=" ? "not in" : "in";
            const joinValues = typeof qf.values[0] === 'string' ? `('${qf.values.join("','")}')` : `(${qf.values.join(',')})`;
            return `q_obj_${qf.field}.key='${qf.field}' and q_obj_${qf.field}.value->>'value' ${op} ${joinValues}`;
        } else {
            const op = qf.op === "!=" ? "!=" : "=";

            const nullChecking = op === "!=" ?
                `(jsonb_typeof(q_obj_${qf.field}.value->'value')!='null' and (q_obj_${qf.field}.value ? 'value'=true))` :
                `(jsonb_typeof(q_obj_${qf.field}.value->'value')='null' or (q_obj_${qf.field}.value ? 'value'=false))`;

            return `q_obj_${qf.field}.key='${qf.field}' and ${nullChecking}`;
        }
    }

    static generate_sort_expression(query: FormQuery, table: string): { sortFrom: string, sortWhere: string, sortOrder: string } {
        const sortOrder = query.sortOrderCTime === "asc" ? "asc" : "desc";
        let fromExp = "";
        let orderExp = "order by ";
        const whereExp: string[] = [];
        if (query.sortFields && query.sortFields.length) {
            query.sortFields.forEach(qf => {
                const qfOrder = qf.order === "asc" ? "asc" : "desc";
                const s_obj = `s_obj_${qf.field}`;
                fromExp = `,jsonb_each(${table}.data#>'{content}') as ${s_obj}`;
                whereExp.push(`${s_obj}.key='${qf.field}'`);
                orderExp += `${s_obj}.value->>'value' ${qfOrder},`;
            });
        }
        return {
            sortFrom: fromExp,
            sortWhere: whereExp.join(" and "),
            sortOrder: `${orderExp} ${table}.data->>'ctime' ${sortOrder}`
        };
    }

    static generate_query_fields(query: FormQuery, table: string): string {
        const queryFields = query.queryFields as FormQueryField[];
        const { sortFrom, sortWhere, sortOrder } = this.generate_sort_expression(query, table);
        const from_assoc = query.ref ? ",forms_assoc" : "";
        const where_assoc = query.ref ? `forms_assoc.ref='${query.ref}' and forms_assoc.form=${table}.data->>'id'` : "";
        const where_indices = query.indices ? `${table}.data->>'id' in ('${query.indices.join("','")}')` : "";
        const sep_where = (query.ref || query.indices || sortWhere !== "") ? "where" : "";
        const sep_and_assoc = query.ref ? "and" : "";
        const sep_and = ((query.ref || query.indices) && sortWhere !== "") ? "and" : "";
        const inside_query = `select * from ${table} ${from_assoc} ${sortFrom} ${sep_where} ${where_assoc} ${sep_and_assoc} ${where_indices} ${sep_and} ${sortWhere}`;
        const inside_query_order = sortOrder;
        // ctime range
        const sqlCTimeRangeInf = query.cTimeRange && query.cTimeRange[0] ? `and (data->>'ctime')::bigint >= ${query.cTimeRange[0]}` : '';
        const sqlCTimeRangeSup = query.cTimeRange && query.cTimeRange[1] ? `and (data->>'ctime')::bigint < ${query.cTimeRange[1]}` : '';
        const inside_query_ctime_range = `${sqlCTimeRangeInf} ${sqlCTimeRangeSup}`;
        const query_limit = query.limit > 0 ? " limit " + query.limit + " offset " + query.offset : "";
        const query_inside_limit = "";
        /* const total_part = "count(*) over() as total";
        const select_part = `select ${total_part}, ${table}.data as data`; */
        let from_part = `from (${inside_query} ${inside_query_ctime_range} ${inside_query_order} ${query_inside_limit}) ${table}`;
        let where_part = "";
        if (queryFields && queryFields.length) {
            where_part += where_part === "" ? " where " : " and ";
            from_part += "," + queryFields.map(_ => `jsonb_each(${table}.data#>'{content}') q_obj_` + _.field).join(",");
            where_part += queryFields.map(_ => this.generate_query_field(_)).join(" and ");
        }
        return from_part + " " + where_part + " " + query_limit;
    }
}