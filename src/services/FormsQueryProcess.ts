import { DbArrayRes, FormAggField, FormInstance, FormInstanceExt, FormQuery, IndexType } from "@codeffekt/ce-core-data";
import { FormQueryParser, FormQueryParserOptions } from "../forms-sql/FormQueryParser";
import { SqlRenderer } from "../forms-sql/SqlRenderer";
import { DatabaseServer } from "../servers/DatabaseServer";
import { DbQueryResults } from "../core";

function addAggFieldsToResForm(res: any, row: any, aggFields: FormAggField[]) {
    if (!res.fields) {
        res.fields = {};
    }

    for (const agg of aggFields) {
        const aggName = `agg_${agg.field}`;
        res.fields[aggName] = parseFloat(row[aggName]); // TODO: voir si on peut mettre le type number dans le select
    }
}

interface ResFormRow {
    total: number;
    data: FormInstance;
    f_form: FormInstance;
    f_name: string;
}

export class FormsQueryProcess {    

    constructor(private db: DatabaseServer) {
    }

    async execute(query: FormQuery, options?: FormQueryParserOptions): Promise<DbArrayRes<FormInstanceExt>> {
        const formParser = new FormQueryParser(query, options);
        const queryDB = SqlRenderer.renderSQLFromSqlAST(formParser.toAST());

        console.log("[FormsQueryProcess] == query begin");
        console.log(queryDB);
        console.log("[FormsQueryProcess] == query end");                    

        try {                                 
            const dbRes = await this.db.query<ResFormRow>(queryDB);                                
            return this.processRes(query, dbRes);                        
        } catch (e) {            
            console.error(e);
            throw e;
        }     
    }

    private processRes(query: FormQuery, dbRes: DbQueryResults<ResFormRow>) {
        const res: DbArrayRes<FormInstanceExt> = {
            total: dbRes.rows.length ? parseInt(dbRes.rows[0].total as any) : 0, // TODO: pourquoi parseInt ?
            limit: query.limit,
            offset: query.offset,
            elts: []
        };

        const known: IndexType[] = [];

        const hasAggFields = query.aggFields?.length > 0;

        // TODO: factorisation use a builder
        if (query.extMode) {
            dbRes.rows.forEach((row: ResFormRow) => {
                let curElt: FormInstanceExt = row.data;
                const idx = known.indexOf(row.data.id);
                if (idx === -1) {
                    known.push(row.data.id);
                    res.elts.push(curElt);
                    if (hasAggFields) {
                        addAggFieldsToResForm(curElt, row, query.aggFields);
                    }
                } else {
                    curElt = res.elts[idx];
                }
                if (!curElt.fields) {
                    curElt.fields = {};
                }
                if ((row.f_form !== null) &&
                    (!query.extFields || query.extFields.includes(row.f_name))) {
                    curElt.fields[row.f_name] = row.f_form;
                }
            });
        } else {
            dbRes.rows.forEach((row: any) => {
                const curElt = row.data;
                if (known.indexOf(row.data.id) === -1) {
                    known.push(row.data.id);
                    res.elts.push(row.data);
                    if (hasAggFields) {
                        addAggFieldsToResForm(curElt, row, query.aggFields);
                    }
                }
            });
        }

        if(query.nodes?.length) {
            dbRes.rows.forEach((row: ResFormRow) => {
                const curElt: FormInstanceExt = row.data;
                if(!curElt.nodes) {
                    curElt.nodes = {};
                }
                for(const node of query.nodes) {
                    if(row[`gn_${node.name}`]) {
                        curElt.nodes[node.name] = row[`gn_${node.name}`];
                    }
                }
            });
        }

        return res;
    }

}