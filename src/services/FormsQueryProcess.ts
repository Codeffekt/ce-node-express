import { DbArrayRes, FormAggField, FormInstance, FormInstanceExt, FormQuery, IndexType } from "@codeffekt/ce-core-data";
import { QueryResult } from "pg";
import { Inject } from "../core/CeService";
import { FormQueryParser, FormQueryParserOptions } from "../forms-sql/FormQueryParser";
import { SqlRenderer } from "../forms-sql/SqlRenderer";
import { DatabaseServer } from "../servers/DatabaseServer";

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

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    constructor() {
    }

    async execute(query: FormQuery, options?: FormQueryParserOptions): Promise<DbArrayRes<FormInstanceExt>> {
        const formParser = new FormQueryParser(query, options);
        const queryDB = SqlRenderer.renderSQLFromSqlAST(formParser.toAST());

        console.log(queryDB);

        const client = await this.db.poolProject.connect();        

        try {
            await client.query('BEGIN');
            //await client.query('SET join_collapse_limit = 1);
            await client.query("CREATE TEMP sequence if not exists temp_seq");
            await client.query("SELECT setval('temp_seq', 1)");
            const dbRes = await client.query<ResFormRow>(queryDB);
            await client.query('COMMIT');
            return this.processRes(query, dbRes);            
        } catch (e) {
            await client.query('ROLLBACK')
            throw e;
        } finally {
            client.release();
        }        
    }

    private processRes(query: FormQuery, dbRes: QueryResult<ResFormRow>) {
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
        return res;
    }

}