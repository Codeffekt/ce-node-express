import {
    IndexType,
    FormInstance,
    getProjectCreator, EltNotFoundError,
    FormUtils, FormInstanceExt, FormBlock
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { ProjectsService } from "../services/ProjectsService";

export class FormUpdateFacade {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private id: IndexType;
    private project: FormInstance;
    private creator: FormBlock;
    private form: FormInstance;

    constructor() { }

    async executeFromForm(elt: FormInstanceExt, author?: IndexType) {
        return this.formsService.updateForm(this.formsService.sanitizeForm(elt, author, Date.now()), author);
    }

    async executeFromForms(elts: FormInstanceExt[], author?: IndexType) {
        const forms = elts.map(elt => this.formsService.sanitizeForm(elt, author, Date.now()));
        return this.formsService.insertForms(forms, author);
    }

    async executeFromAssoc(elts: FormInstance[], ref: IndexType, author?: IndexType) {
        // 1. retrieve existing forms
        const existingFormsRes = await this.formsService.getFormsQuery({
            indices: elts.map(f => f.id)
        });
        // 2. merge the content        
        const mergedForms = [];
        for (const form of elts) {
            const existingForm = existingFormsRes.elts.find(f => f.id === form.id);
            mergedForms.push(existingForm ? {
                ...existingForm,
                ...form,
                content: { ...existingForm.content, ...form.content },
                ctime: existingForm.ctime,
                root: existingForm.root
            } : form);
        }
        // 3. upsert the db          
        await this.formsService.insertForms(mergedForms, author);
        // 4. upsert form assoc    
        await this.formsService.insertFormsAssoc(mergedForms.map(elt => ({
            ref: ref,
            form: elt.id
        })));
        return true;
    }

    async execute(pid: IndexType, creatorId: IndexType, id: IndexType) {

        await this.init(pid, creatorId, id);
        await this.retrieveForm();
        await this.deleteFormFromProject();
        await this.deleteSubForms();

        return true;

    }

    private async init(pid: IndexType, creatorId: IndexType, id: IndexType) {
        this.id = id;
        this.project = await this.projectsService.getProject(pid);
        this.creator = getProjectCreator(this.project, creatorId);
    }

    private async retrieveForm() {
        this.form = await this.formsService.getForm(this.id);

        if (!this.form) {
            throw new EltNotFoundError(`Cannot find form ${this.id}`, { pid: this.project.id, id: this.id });
        }
    }

    private async deleteFormFromProject() {
        await this.formsService.deleteFormAssoc({ ref: this.creator.params.ref, form: this.form.id });
    }

    private async deleteSubForms() {
        const cascadeFormsFields = this.formsService.getRequiredFormsFromRoot(this.form).map(b => b.field);

        const formsIds = [
            this.form.id,
            ...FormUtils.getBlocks(this.form).filter(b => b.value && cascadeFormsFields.includes(b.field))
                .map(b => b.value)
        ];

        await this.formsService.deleteForms(formsIds);
    }
}