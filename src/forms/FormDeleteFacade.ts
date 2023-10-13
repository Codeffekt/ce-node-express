import {
    IndexType,
    FormInstance,
    getProjectCreator, EltNotFoundError,
    FormUtils, FormAssoc, FormBlock
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { ProjectsService } from "../services/ProjectsService";
import { ForkFieldsUtils } from "./ForkFieldsUtils";

const ARRAY_DELETE_FORMS_LIMIT = 100;

export class FormDeleteFacade {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private id: IndexType;
    private project: FormInstance;
    private creator: FormBlock;
    private form: FormInstance;

    private deletedAssocs: FormAssoc[] = [];
    private deletedFormIds: IndexType[] = [];

    constructor(private includesFields?: IndexType[], private excludesFields?: IndexType[]) { }

    async execute(pid: IndexType, creatorId: IndexType, id: IndexType) {

        await this.init(pid, creatorId, id);
        await this.retrieveForm();
        await this.deleteArrayFields();
        await this.deleteFormFromProject();
        await this.deleteSubForms();

        await this.formsService.deleteFormsAssocs(this.deletedAssocs);
        await this.formsService.deleteForms(this.deletedFormIds);

        return true;

    }

    private async init(pid: IndexType, creatorId: IndexType, id: IndexType) {
        this.id = id;
        this.project = await this.projectsService.getProject(pid);
        this.creator = getProjectCreator(this.project, creatorId);
        this.deletedAssocs = [];
        this.deletedFormIds = [];
    }

    private async retrieveForm() {
        this.form = await this.formsService.getForm(this.id);

        if (!this.form) {
            throw new EltNotFoundError(`Cannot find form ${this.id}`, { pid: this.project.id, id: this.id });
        }
    }

    private async deleteFormFromProject() {
        this.deletedAssocs.push({ ref: this.creator.params.ref, form: this.form.id });
    }

    private async deleteSubForms() {
        const cascadeFormsFields = this.formsService.getRequiredFormsFromRoot(this.form).map(b => b.field);

        const formsIds = [
            this.form.id,
            ...FormUtils.getBlocks(this.form).filter(b => b.value && cascadeFormsFields.includes(b.field))
                .map(b => b.value)
        ];

        this.deletedFormIds = this.deletedFormIds.concat(formsIds);
    }

    private async deleteArrayFields() {
        if (!this.includesFields?.length) {
            return;
        }

        const predWithFields = ForkFieldsUtils.getPredicateWithFields(
            this.includesFields, this.excludesFields
        );
        const predArray = ForkFieldsUtils.getPredicateArray();

        const arrayBlocks = Object.values(this.form.content).filter(
            block => predArray(block) && predWithFields(block)
        );

        for (const arrayblock of arrayBlocks) {
            await this.deleteArray(arrayblock);
        }
    }

    private async deleteArray(block: FormBlock) {

        await this.formsService.deleteFormsQuery({
            queryRootFields: [{
                field: 'root',
                op: '=',
                value: block.root
            }],
            queryFields: [{
                op: "=",
                field: block.index,
                value: this.form.id,
            }],
            offset: 0,
            limit: ARRAY_DELETE_FORMS_LIMIT
        });

        // TODO: support for sub fields
    }
}