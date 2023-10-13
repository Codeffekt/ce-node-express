import { DbArrayRes, FormInstance, FormInstanceExt, FormQuery, FormVersion, IndexType } from "@codeffekt/ce-core-data";
import { CeService, Inject, Service } from "../core/CeService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { ContextService } from "./ContextService";
import { FormsQueryProcess } from "./FormsQueryProcess";
import * as format from "pg-format";
import { FormsService } from "./FormsService";
import { Subscription } from "rxjs";
import { ProjectsService } from "./ProjectsService";
import { AccountsService } from "./AccountsService";
import { FormAccountBuilder } from "../account/FormAccountBuilder";
import { DB_TABLE_ACCOUNTS, DB_TABLE_FORMS, DB_TABLE_FORMSROOT, DB_TABLE_FORMS_ASSOC } from "../core/Db";

interface GenericCommitOptions {
    author?: IndexType;
    elts: FormInstance[];
    copyFunc: (form: FormInstanceExt) => FormInstance;
    versionFunc: (action: GenericCommitAction) => FormVersion;
}

interface GenericCommitAction {
    author?: IndexType;
    commit: FormInstance;
    lastCommit?: FormInstance;
}

function createAddCommitVersion(action: GenericCommitAction): FormVersion {
    return {
        author: action.author,
        head: action.commit.id,
        prev: action.lastCommit ? action.lastCommit.id : undefined,
    };
}

@Service()
export class FormsVersionService {

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    @Inject(ContextService)
    private readonly context: ContextService;

    private formSub: Subscription;
    private projSub: Subscription;
    private accountSub: Subscription;

    constructor() { }

    listenToFormsService() {
        this.disconnectFromFormsService();

        this.formSub = CeService.get(FormsService)
            .formUpdate$
            .subscribe((evt) => {
                this.context.logInfo(`[FormsVersion] receive forms service event ${evt}`);
                this.commits(evt.elts, evt.author);
            });

        this.context.logInfo("[FormsVersion] Listen to forms service");
    }

    listenToProjectsService() {
        this.disconnectFromProjectsService();

        this.projSub = CeService.get(ProjectsService)
            .projectUpdate$
            .subscribe((evt) => {                
                this.context.logInfo(`[FormsVersion] receive projects service event ${evt}`);
                this.commits([
                    evt.elt
                ], evt.author);
            });

    }

    listenToAccountsService() {
        this.disconnectFromAccountsService();

        this.projSub = CeService.get(AccountsService)
            .accountUpdate$
            .subscribe((evt) => {                
                this.context.logInfo(`[FormsVersion] receive projects service event ${evt}`);
                this.commits(evt.elts.map(elt => FormAccountBuilder.fromAccount(elt, evt.author).core), evt.author);
            });
    }

    disconnectFromFormsService() {
        if (this.formSub) {
            this.formSub.unsubscribe();
            this.formSub = undefined;
        }
    }

    disconnectFromProjectsService() {
        if (this.projSub) {
            this.projSub.unsubscribe();
            this.projSub = undefined;
        }
    }

    disconnectFromAccountsService() {
        if (this.accountSub) {
            this.accountSub.unsubscribe();
            this.accountSub = undefined;
        }
    }

    async commits(elts: FormInstance[], author?: IndexType): Promise<boolean> {
        return this.generic_commits({
            author,
            elts,
            copyFunc: this.context.copyForm.bind(this.context),
            versionFunc: createAddCommitVersion
        });
    }

    async getFormsQuery(query: FormQuery): Promise<DbArrayRes<FormInstance | FormInstanceExt>> {
        const queryProcess = new FormsQueryProcess();
        return queryProcess.execute(query, {
            formsTableName: DB_TABLE_FORMS,
            formsRootTableName: DB_TABLE_FORMSROOT,
            accountsTableName: DB_TABLE_ACCOUNTS,
            assocsTableName: DB_TABLE_FORMS_ASSOC,
            rootTableName: "forms_version"
        });
    }

    async upsertForm(src: FormInstance): Promise<FormInstance> {
        await this.db.poolProject.query("insert into forms_version(data) values($1) on conflict((data->>'id')) do update set data=$1",
            [JSON.stringify(src)])
        return src;
    }

    private async generic_commits(options: GenericCommitOptions) {
        const lastCommits = await this.getLastCommits(options.elts.map(elt => elt.id));
        const newCommits: FormInstance[] = [];
        for (const commit of options.elts) {
            const newCommit = options.copyFunc(commit);
            const lastCommit = lastCommits.find(elt => elt.version.head === commit.id);
            newCommit.version = options.versionFunc({
                author: options.author,
                commit,
                lastCommit
            });
            if (lastCommit) {
                lastCommit.version.next = newCommit.id;
                newCommits.push(lastCommit);
            }
            newCommits.push(newCommit);
        }

        return this.insertForms(newCommits);
    }

    private async getLastCommits(ids: IndexType[]): Promise<FormInstance[]> {
        const values = ids.map(id => `'${id}'`).join(',');
        const res = await
            this.db.poolProject.query(
                `select data from forms_version where data->'version'->'next' is null and data->'version'->>'head'=ANY(ARRAY[${values}]::text[])`
            );
        return res.rows.map(row => row.data);
    }

    private async insertForms(elts: FormInstance[]): Promise<boolean> {
        const query = format(`insert into forms_version(data) values %L on conflict((data->>'id')) do update set data=excluded.data`, elts.map(elt => [elt]));
        await this.db.poolProject.query(query);
        return true;
    }
}