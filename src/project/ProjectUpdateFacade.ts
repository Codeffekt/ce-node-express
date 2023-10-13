import { IndexType } from "@codeffekt/ce-core-data";
import { OldProject } from "../core";
import { Inject } from "../core/CeService";
import { ProjectsService } from "../services/ProjectsService";

export class ProjectUpdateFacade {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    constructor() {
    }

    async execute(projectInput: Partial<OldProject>, author: IndexType) {
        throw new Error(`ProjectUpdateFacade::execute deprecated`);
        /* const existingProject = await this.projectsService.getProject(projectInput.id);
        if (!existingProject) {
            throw new Error(`OldProject ${projectInput.id} does not exist cannot update`);
        }            
        return this.projectsService.updateProject({ ...existingProject, ...projectInput }, author); */
    }
}
