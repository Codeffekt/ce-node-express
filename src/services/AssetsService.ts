import { AssetElt, DbArrayRes, EltNotFoundError, FormInstance, FormQuery, FormQueryField, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { DatabaseServer } from "../servers/DatabaseServer";

function createFormInstanceFromAsset(data: AssetElt): FormInstance {
    return {
        id: data.id,
        root: 'form-asset',
        ctime: data.ctime,
        mtime: data.mtime,
        valid: true,
        title: data.name,
        content: {
            id: {
                field: "id",
                label: "Id",
                type: 'index',
                value: data.id
            },
            ctime: {
                field: "ctime",
                label: "Date de création",                
                type: 'timestamp',
                value: data.ctime
            },
            ref: {
                field: "ref",
                label: "Ref",
                type: 'index',
                value: data.ref
            },
            name: {
                field: "name",
                label: "Nom",
                type: "text",
                value: data.name
            },            
            originalname: {
                field: "originalname",
                label: "Nom d'origine",
                type: "text",
                value: data.originalname
            },   
            mimetype: {
                field: "mimetype",
                label: "Format",
                type: "text",
                value: data.mimetype
            },   
            size: {
                field: "size",
                label: "Taille",
                type: "number",
                value: data.size
            },   
            metadata: {
                field: "metadata",
                label: "Metadonnees",
                type: "object",
                value: data.metadata
            },   
        }
    };
}

@Service()
export class AssetsService {

    static DB_ASSETS = "assets";

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    constructor() {
    }

    async getAssets(ref: IndexType, limit: number = 0, offset: number = 0, mimetypes: string[] = undefined): Promise<AssetElt[]> {

        const queryMimeString = mimetypes !== undefined ? `and data->>'mimetype'=ANY(ARRAY[${mimetypes.map(m => `'${m}'`).join(',')}]::text[])` : '';
        const queryLimit = limit > 0 ? `limit ${limit} offset ${offset}` : '';
        const query = `select * from assets where ref='${ref}' ${queryMimeString} order by (data->>'ctime')::bigint desc ${queryLimit}`;
        const res = await this.db.poolProject.query(query);
        return res.rows.map((elt: any) => elt.data);
    }

    async getFormsQuery(query: FormQuery): Promise<DbArrayRes<FormInstance>> {
        const qfMimeTypes: FormQueryField<string> = Array.isArray(query.queryFields) ? query.queryFields.find((qf: any) => qf.field && qf.field === "mimetype") as FormQueryField<string> : undefined;
        const queryMimeString = qfMimeTypes !== undefined && qfMimeTypes.values ? `data->>'mimetype'=ANY(ARRAY[${qfMimeTypes.values.map(m => `'${m}'`).join(',')}]::text[])` : undefined;
        const queryRef = query.ref ? `ref='${query.ref}'` : undefined;
        const queryIndices = query.indices?.length ? `data->>'id'=ANY(ARRAY[${query.indices.map(id => `'${id}'`).join(',')}]::text[])` : undefined;

        const whereExprs = [
            queryMimeString,
            queryRef,
            queryIndices
        ].filter(elt => elt !== undefined);

        const queryLimit = `limit ${query.limit} offset ${query.offset}`;
        const whereOp = whereExprs.length ? 'where' : '';        
        const queryString = `select count(*) over() as total, data from assets ${whereOp} ${whereExprs.join(" and ")} order by (data->>'ctime')::bigint desc ${queryLimit}`;          
        const res = await this.db.poolProject.query(queryString);
        return {
            elts: res.rows.map(row => createFormInstanceFromAsset(row.data)),
            limit: query.limit,
            offset: query.offset,
            total: res.rows.length ? res.rows[0].total : 0
        };
    }

    getAssetsCount(ref: IndexType): Promise<number> {
        return this.db.poolProject.query("select count(*) as total from assets where ref=$1", [ref])
            .then((res: any) => res.rows.length ? res.rows[0].total : undefined);
    }

    getAsset(id: IndexType): Promise<AssetElt> {
        return this.get_with_id(this.db.poolProject, AssetsService.DB_ASSETS, id);
    }

    deleteAsset(id: IndexType): Promise<boolean> {
        return this.db.poolProject.query("delete from assets where data->>'id'=$1", [id]).then(() => true);
    }

    async deleteAssets(ref?: IndexType, ids: IndexType[] = []): Promise<boolean> {        

        if(!ids.length) {
            return true;
        }        

        const idsListStr = ids.map(id => `'${id}'`).join(",");
        const queryRef = ref ? `ref='${ref}' and` : '';
        const query = `delete from assets where ${queryRef}
            data->>'id'=ANY(ARRAY[${idsListStr}]::text[])`;        
        await this.db.poolProject.query(query);
        return true;
    }

    async insertAsset(ref: IndexType, elt: AssetElt): Promise<AssetElt> {
        await this.fill_table_ref(this.db.poolProject, AssetsService.DB_ASSETS,
            [[ref, elt]]);
        return elt;
    }

    updateAsset(elt: AssetElt): Promise<AssetElt> {
        return this.update_table(this.db.poolProject, AssetsService.DB_ASSETS, [elt]).then(_ => elt);
    }

    private async update_table(pool: any, tableName: string, elts: any[]) {
        const text = "update " + tableName + " set data=$1 where (data->>'id')::text=$2";
        for (let i = 0; i < elts.length; i++) {
            await pool.query(text, [JSON.stringify(elts[i]), elts[i].id]);
        }
    }

    private async get_with_id(pool: any, tableName: string, id: IndexType, idFieldName: string = "id"): Promise<any> {
        const text = "SELECT data from " + tableName + " where (data->>'" + idFieldName + "')::text='" + id + "'";
        const res = await pool.query(text);
        if (!res.rows.length) {
            throw new EltNotFoundError("element id=" + id + " not found", { tableName: tableName, id: id });
        }
        return res.rows[0].data;
    }

    private async fill_table_ref(pool: any, tableName: string, elts: any[]) {
        const text = "INSERT INTO " + tableName + " (ref, data) VALUES($1,$2)";
        for (let i = 0; i < elts.length; i++) {
            await pool.query(text, [elts[i][0], JSON.stringify(elts[i][1])]);
        }
    }
}