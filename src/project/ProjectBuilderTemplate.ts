import {
    FormCreator,
    FormProjectTemplate,
    FormWrapper,
    ProjectType
} from "@codeffekt/ce-core-data";
import { OldProject } from "../core";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class ProjectBuilderTemplate {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    async create(projectInput: OldProject) {
        const template = await this.retrieveProjectTemplate(projectInput.type);
        return template ? this.createProjectFromTemplate(template.props, projectInput) : projectInput;
    }

    private async retrieveProjectTemplate(projectType: ProjectType): Promise<FormWrapper<FormProjectTemplate>> {
        const res = await this.formsService.getFormsQuery({
            queryFields: [
                {
                    field: "root",
                    op: "=",
                    value: FormProjectTemplate.ROOT,
                    onMeta: true
                },
                {
                    field: "type",
                    op: "=",
                    value: projectType
                },
            ],
            limit: 1,
            offset: 0
        });

        return res.elts.length ? FormWrapper.fromForm(res.elts[0]) : undefined;
    }

    private createProjectFromTemplate(template: FormProjectTemplate, projectInput: OldProject): OldProject {
        return {
            name: template.name,
            status: "TODO",
            ...projectInput,
            assets: `assets-${projectInput.id}`,
            forms: this.createAssocs(template, projectInput),
            params: template.params,
            type: template.type,
        };
    }

    private createAssocs(template: FormProjectTemplate, projectInput: OldProject): FormCreator[] {
        return [...this.createLocalAssocs(template, projectInput), ...this.createSharedAssocs(template)];
    }

    private createLocalAssocs(template: FormProjectTemplate, projectInput: OldProject): FormCreator[] {
        return template.forms.filter(assoc => !assoc.shared).map(assoc => ({
            ...assoc,
            ref: `${assoc.id}-${projectInput.id}`
        }));
    }

    private createSharedAssocs(template: FormProjectTemplate): FormCreator[] {
        return template.forms.filter(assoc => assoc.shared).map(assoc => ({
            ...assoc,
            ref: assoc.ref ?? `${assoc.id}-shared`
        }));
    }
}