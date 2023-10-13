import { DbArrayRes, EltNotFoundError, FormBlockEntity, FormInstance, FormInstanceExt, FormQuery, FormRootEntity, IndexType } from "@codeffekt/ce-core-data";
import { AuthService, AuthTokenData } from "./AuthService";
import { Inject, Service } from "../core/CeService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { FormsService } from "./FormsService";
import { FormsQueryProcess } from "./FormsQueryProcess";
import { FormQueryParser } from "../forms-sql/FormQueryParser";
import { SqlRenderer } from "../forms-sql/SqlRenderer";
import { AccountsService } from "./AccountsService";
import { DB_TABLE_ACCOUNTS, DB_TABLE_FORMS, DB_TABLE_FORMSROOT, DB_TABLE_FORMS_ASSOC } from "../core/Db";

@FormRootEntity({ id: ApiToken.ROOT, title: "Form Ce-Token", table: "ce-token" })
export class ApiToken {

    static readonly ROOT = "form-ce-token";

    @FormBlockEntity({ type: 'text' })
    sub: IndexType;

    @FormBlockEntity({ type: 'text' })
    aud: string | string[];

    @FormBlockEntity({ type: 'timestamp' })
    exp: number;

    @FormBlockEntity({ type: 'text' })
    token: string;
}

@Service()
export class FormsApiTokensService {

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    @Inject(AuthService)
    private readonly tokenService: AuthService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor() { }

    async generateToken(account: IndexType, expirationTime?: number) {

        const existingAccount = await this.accountsService.getAccountFromId(account);

        if (!existingAccount) {
            throw new EltNotFoundError(`Account ${account} does not exist`, { account });
        }

        const newToken = await this.tokenService.createToken({
            aud: "ce-forms-api",
            sub: existingAccount.login,
            uid: account
        }, expirationTime);

        return this.upsertForm(this.createFormFromToken(newToken));
    }

    async getFormsQuery(query: FormQuery): Promise<DbArrayRes<FormInstance | FormInstanceExt>> {
        const queryProcess = new FormsQueryProcess();
        return queryProcess.execute(query, { 
            formsTableName: DB_TABLE_FORMS,
            formsRootTableName: DB_TABLE_FORMSROOT,
            accountsTableName: DB_TABLE_ACCOUNTS,
            assocsTableName: DB_TABLE_FORMS_ASSOC,
            rootTableName: "forms_token"
        });
    }

    async deleteFormsQuery(query: FormQuery): Promise<boolean> {
        const parser = new FormQueryParser(query, { 
            formsTableName: DB_TABLE_FORMS,
            formsRootTableName: DB_TABLE_FORMSROOT,
            accountsTableName: DB_TABLE_ACCOUNTS,
            assocsTableName: DB_TABLE_FORMS_ASSOC,
            rootTableName: "forms_token"
        });
        const queryFields = SqlRenderer.renderSQLFromSqlAST(parser.toSelectFieldsIdsAST());

        // delete forms
        let queryDB = `delete from forms_token where data->>'id' in (${queryFields})`;
        await this.db.poolProject.query(queryDB);

        return true;
    }

    private createFormFromToken(token: AuthTokenData) {
        const entity = new ApiToken();
        entity.aud = token.payload.aud;
        entity.sub = token.payload.sub;
        entity.exp = token.payload.exp;
        entity.token = token.token;
        return this.formsService.createFormFromEntity(entity, entity.sub);
    }

    private async upsertForm(src: FormInstance) {
        await this.db.poolProject.query("insert into forms_token(data) values($1) on conflict((data->>'author')) do update set data=$1",
            [JSON.stringify(src)])
        return src;
    }
}