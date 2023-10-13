import { filter } from "rxjs/operators";
import { EltNotFoundError, FormInstance, FormSharing, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { DatabaseServer, isProjectsUpdate } from "../servers/DatabaseServer";
import { ReplaySubject } from "rxjs";
import { FormsService } from "./FormsService";
import { OldProject } from "../core/OldProject";

export interface ProjectUpdateEvent {
    elt: FormInstance;
    author: IndexType;
}

@Service()
export class ProjectsService {

    projectUpdate$: ReplaySubject<ProjectUpdateEvent> = new ReplaySubject(1);

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(DatabaseServer)
    private readonly db: DatabaseServer;

    constructor() {
    }

    onProjectsChanged() {
        return this.db.tableUpdate$.pipe(
            filter(isProjectsUpdate)
        );
    }

    getProjects(): Promise<OldProject[]> {
        return this.db.getCachedProjects();
    }

    getOldProjects(): Promise<OldProject[]> {
        return this.db.getCachedProjects();
    }

    async getProject(id: string): Promise<FormInstance> {
        const project = await this.formsService.getForm(id);
        if (!project) {
            throw new EltNotFoundError(`Project ${id} not found`, { id });
        }
        return project;
    }    

    async getOldProject(id: string): Promise<OldProject> {
        const project = (await this.db.getCachedProjects()).find(_ => _.id === id);
        if (!project) {
            throw new EltNotFoundError(`OldProject ${id} not found`, { id });
        }
        return project;
    }

    async updateProject(project: FormInstance, author: IndexType): Promise<boolean> {

        await this.formsService.updateForm(project, author);

        /* await this.db.poolProject.query("insert into projects(data) values($1) on conflict((data->>'id')) do update set data=$1",
            [JSON.stringify(project)]); */
        this.projectUpdate$.next({ elt: project, author });
        return true;
    }

    async deleteProject(id: string): Promise<boolean> {

        // suppression des formulaires de partage puis suppression du projet
        await this.formsService.deleteFormsQuery({
            queryFields: [
                {
                    field: 'root',
                    onMeta: true,
                    op: '=',
                    value: FormSharing.ROOT
                },
                {
                    field: 'form',
                    op: '=',
                    value: id
                }
            ]
        });
        await this.formsService.deleteForms([id]);

        this.db.clearCachedProjects();
        /* await this.db.poolProject.query("delete from projects where data->>'id'=$1", [id]); */


        return true;
    }
}