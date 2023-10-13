import { FormSharing, FormWrapper, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services";
import { AccountsService } from "../services/AccountsService";
import { ProjectsService } from "../services/ProjectsService";

export class ProjectDeleteFacade {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor() {
    }

    async execute(pid: IndexType, creatorId: IndexType) {
        const account = await this.accountsService.getAccountFromId(creatorId);

        const project = await this.formsService.getForm(pid);        

        if (!project) {
            return true;
        }

        if (FormWrapper.getFormValue('account', project) === account.account) {        
            return this.projectsService.deleteProject(pid);
        } else {
            throw new Error(`Invalid or Unauthorized action removeProject for ${creatorId} on ${pid}`);
        }
    }
}
