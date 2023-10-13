import { AccountSettings } from "@codeffekt/ce-core-data";
import { OldProject } from "../core/OldProject";
import { Inject } from "../core/CeService";
import { ContextService } from "../services/ContextService";
import { ProjectsService } from "../services/ProjectsService";
import { ProjectBuilderAppConfig, PROJECT_TYPE_APP_CONFIG } from "./ProjectBuilderAppConfig";
import { ProjectBuilderTemplate } from "./ProjectBuilderTemplate";

export interface IProjectBuilder {
    create(projectInput: OldProject): Promise<OldProject>;
}

interface IProjectBuilderConstructor {
    new(): IProjectBuilder;
}

function createProjectBuilder(ctor: IProjectBuilderConstructor): IProjectBuilder {
    return new ctor();
}

const PROJECT_BUILDER_FACTORY: { [key: string]: IProjectBuilderConstructor } = {    
    [PROJECT_TYPE_APP_CONFIG]: ProjectBuilderAppConfig
};

export class ProjectBuilder {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(ContextService)
    private readonly context: ContextService;

    constructor(private creator: AccountSettings) {

    }

    static addBuilder(key: string, builder: IProjectBuilderConstructor) {
        PROJECT_BUILDER_FACTORY[key] = builder;
    }

    async create(projectInput?: Partial<OldProject>) {        
        throw new Error("Deprecated ProjectBuilder::create");
    }

    private createCore(projectInput?: Partial<OldProject>) {
        const core = this.context.createCore();
        return {
            name: "Sans nom",            
            ...projectInput,
            ...core,
            account: this.creator.account,
        } as OldProject;
    }

    private async applyFactory(newProject: OldProject) {
        if (newProject.type) {
            const builder = PROJECT_BUILDER_FACTORY[newProject.type];            
            if (builder) {                
                return await this.createWithFactory(createProjectBuilder(builder), newProject);
            } else {
                return await this.createWithTemplate(newProject);
            }
        }
        return newProject;
    }

    private async createWithFactory(builder: IProjectBuilder, projectInput: OldProject) {        
        return await builder.create(projectInput);
    }

    private async createWithTemplate(projectInput: OldProject) {        
        const builder = new ProjectBuilderTemplate();
        return await builder.create(projectInput);
    }
}
