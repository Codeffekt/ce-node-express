import { AssetsDeleteFacade } from "../assets/AssetsDeleteFacade";
import { FormCreateFacade } from "../forms/FormCreateFacade";
import { FormDeleteFacade } from "../forms/FormDeleteFacade";
import { FormMutateFacade } from "../forms/FormMutateFacade";
import { FormsQueryFacade } from "../forms/FormsQueryFacade";
import { FormQueryFacade } from "../forms/FormQueryFacade";
import { ProjectBuilder } from "./ProjectBuilder";
import {
    IndexType, getProjectCreator,
    ROLE_CREATE, FormInstance,
    FormQuery,
    DbArrayRes, FormInstanceExt,
    AssetElt, CoreIndexElt, ProjectSettingsError,
    AccountSettings, getProjectRef, FormMutate, FormWrapper, FormProjectWrapper, FORM_PROJECT_ASSETS_FIELD,
} from "@codeffekt/ce-core-data";
import {
    CeApiAccountId, CeApiAdmin,
    CeApiBinds, CeApiCall,
    CeApiComponent, CeApiRole
} from "../express-router/ApiModule";
import { Inject } from "../core/CeService";
import { ProjectsService } from "../services/ProjectsService";
import { FormsService } from "../services/FormsService";
import { AccountsService } from "../services/AccountsService";
import { AssetsService } from "../services/AssetsService";
import { ContextService } from "../services/ContextService";
import { ProjectDeleteFacade } from "./ProjectDeleteFacade";
import { FormMutatesFacade } from "../forms/FormMutatesFacade";
import { OldProject } from "../core";

@CeApiComponent()
export class PublicProject {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    @Inject(ContextService)
    private readonly context: ContextService;

    constructor() { }

    @CeApiCall
    getProject(id: IndexType): Promise<FormInstance> {
        return this.projectsService.getProject(id);
    }

    @CeApiCall
    @CeApiBinds
    async getDefaultProject(@CeApiAccountId id: IndexType, type: IndexType): Promise<OldProject> {
        const projects = await this.projectsService.getProjects();
        const account = await this.accountsService.getAccountFromId(id);
        return projects.find(p => p.account === account.account && p.type === type);
    }

    /* @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    updateProject(@CeApiAccountId id: IndexType, project: OldProject): Promise<boolean> {
        return this.projectsService.updateProject(project, id);
    } */

    @CeApiCall
    @CeApiBinds
    async getAll(@CeApiAccountId id: IndexType) {
        const account = await this.accountsService.getAccountFromId(id);
        const projects = await this.projectsService.getProjects();
        return projects.filter(project => project.account === account.account);
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    async createBucket(pid: IndexType, elt: AssetElt) {

        // TODO: create bucket facade

        const core: CoreIndexElt = this.context.createCore();
        const asset: AssetElt = {
            metadata: { timestamp: Date.now() as any },
            ...elt,
            ...core,
            ref: pid,
            id: elt.id || core.id
        };

        const project = await this.projectsService.getProject(pid);

        const assets = FormProjectWrapper.getAssetsRef(project);

        if (!assets) {
            throw new ProjectSettingsError(`OldProject ${project.id} does not have ${FORM_PROJECT_ASSETS_FIELD} property`);
        }

        return this.assetsService.insertAsset(assets, asset);
    }

    @CeApiCall
    async getAssets(pid: IndexType, limit: number = 0, offset: number = 0, mimetypes: string[] = undefined) {
        const project = await this.projectsService.getProject(pid);
        return this.assetsService.getAssets(
            FormProjectWrapper.getAssetsRef(project), limit, offset, mimetypes
        );
    }

    @CeApiCall
    getAssetsCount(pid: IndexType) {
        return this.projectsService.getProject(pid)
            .then(project => this.assetsService.getAssetsCount(
                FormProjectWrapper.getAssetsRef(project)
            ));
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async deleteAssets(@CeApiAccountId id: IndexType, pid: IndexType, assets: IndexType[], deleteFile = true) {
        const account = await this.accountsService.getAccountFromId(id);
        const project = await this.projectsService.getProject(pid);
        const deleteAction = new AssetsDeleteFacade(
            account,
            FormProjectWrapper.getAssetsRef(project)
        );
        return deleteAction.execute(assets, deleteFile);
    }

    @CeApiCall
    @CeApiAdmin
    getUsers(pid: IndexType, limit: number = 0, offset: number = 0): Promise<AccountSettings[]> {
        return this.projectsService.getProject(pid)
            .then(project => this.accountsService.getUsers(
                FormWrapper.getFormValue("account", project),
                limit, offset));
    }

    @CeApiCall
    @CeApiAdmin
    getUsersCount(pid: IndexType) {
        return this.projectsService.getProject(pid)
            .then(project => this.accountsService.getUsersCount(
                FormWrapper.getFormValue("account", project)
            ));
    }

    @CeApiCall
    getForms(pid: IndexType, creator: IndexType, limit: number, offset: number): Promise<DbArrayRes<FormInstance>> {
        return this.projectsService.getProject(pid)
            .then(project => this.formsService.getFormsFromAssoc({ ref: getProjectRef(project, creator), limit: limit, offset: offset }));
    }

    @CeApiCall
    async getFormQuery(pid: IndexType, id: IndexType, creator: IndexType, query: FormQuery): Promise<FormInstanceExt> {
        const formQueryFacade = new FormQueryFacade(pid, id, query, creator);
        return formQueryFacade.execute();
    }

    @CeApiCall
    async getFormsQuery(pid: IndexType, creator: IndexType, query: FormQuery): Promise<DbArrayRes<FormInstance | FormInstanceExt>> {
        const formsQueryFacade = new FormsQueryFacade(pid, query, creator);
        return formsQueryFacade.execute();
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    async createForm(@CeApiAccountId id: IndexType, pid: IndexType, creator: IndexType) {
        const formBuilder = new FormCreateFacade();
        return formBuilder.create(pid, creator, id);
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    @CeApiBinds
    async formMutation(@CeApiAccountId id: IndexType, pid: IndexType, mutation: FormMutate) {
        const formMutate = new FormMutateFacade(pid, { ...mutation, author: id });
        return formMutate.execute();
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    @CeApiBinds
    async formMutations(@CeApiAccountId id: IndexType, pid: IndexType, mutations: FormMutate[]) {
        const formMutate = new FormMutatesFacade(pid, mutations, id);
        return formMutate.execute();
    }

    @CeApiCall
    async formsQuery(pid: IndexType, query: FormQuery) {
        const formsQueryFacade = new FormsQueryFacade(pid, query);
        return formsQueryFacade.execute();
    }

    @CeApiCall
    async formQuery(pid: IndexType, id: IndexType, query: FormQuery): Promise<FormInstanceExt> {
        const formQueryFacade = new FormQueryFacade(pid, id, query);
        return formQueryFacade.execute();
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    async deleteForm(pid: IndexType, creator: IndexType, id: IndexType): Promise<boolean> {
        const formDeleteFacade = new FormDeleteFacade();
        return formDeleteFacade.execute(pid, creator, id);
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    deleteForms(pid: IndexType, creator: IndexType): Promise<boolean> {
        return this.projectsService.getProject(pid)
            .then(project => this.formsService.deleteFormsAssoc(getProjectCreator(project, creator).params.ref));
    }

    @CeApiCall
    @CeApiRole(ROLE_CREATE)
    deleteFormsQuery(pid: IndexType, creator: IndexType, query: FormQuery): Promise<boolean> {
        return this.projectsService.getProject(pid)
            .then(project => {
                const pCreator = getProjectCreator(project, creator);
                query.ref = pCreator.params.ref;
                return this.formsService.deleteFormsQuery(query);
            });
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async createProject(@CeApiAccountId id: IndexType, project?: Partial<OldProject>) {
        const creator = await this.accountsService.getAccountFromId(id);
        const builder = new ProjectBuilder(creator);
        return builder.create(project);
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async removeProject(@CeApiAccountId id: IndexType, pid: IndexType) {
        const action = new ProjectDeleteFacade();
        return action.execute(pid, id);
    }

    @CeApiCall
    @CeApiAdmin
    @CeApiBinds
    async getMembers(@CeApiAccountId id: IndexType, pid: IndexType) {
        const curAccount = await this.accountsService.getAccountFromId(id);
        const accounts = await this.accountsService.getAccounts();
        const curAccountMembers = accounts.filter(account => account.account === curAccount.account);
        return curAccountMembers.filter(account => account.projects && account.projects.includes(pid));
    }
}
