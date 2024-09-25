import { EltNotFoundError, FormAssoc, FormInstance, FormUtils, FormWrapper, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormTemplateBuilder } from "./template/FormTemplateBuilder";

export class FormCreateFromRootFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;   

    private newForms: FormInstance[] = [];
    private newAssocs: FormAssoc[] = [];
    private form: FormInstance;

    constructor() {

    }

    async createFromRoot(root: IndexType, partialContent: any, author: IndexType): Promise<FormInstance> {
        await this.createWrapper(root, partialContent, author);
        await this.createRequiredSubForms(author);
        await this.insertRequiredSubForms(author);
        await this.addFormsToAssoc();

        return this.form;
    }

    private async createWrapper(root: IndexType, partialContent: any, authorId: IndexType) {
        const formRoot = await this.formsService.getFormRoot(root);
        if (!formRoot) {
            throw new EltNotFoundError(`Cannot create form, form root ${root} not found`, { root });
        }
        const builder = new FormTemplateBuilder();
        this.form = builder.fromFormRoot(formRoot, partialContent, authorId);    
    }

    private async insertRequiredSubForms(author?: IndexType) {
        if (this.newForms && this.newForms.length) {            
            await this.formsService.insertForms(this.newForms, author);
        }
    }

    private async addFormsToAssoc() {
        if (this.newAssocs && this.newAssocs.length) {
            await this.formsService.insertFormsAssoc(this.newAssocs);
        }
    }

    private async createRequiredSubForms(authorId: IndexType) {
        const requiredForms = this.formsService.getRequiredFormsFromRoot(this.form);

        this.newForms = [this.form];
        this.newAssocs = [];

        for (const block of requiredForms) {
            const root = await this.formsService.getFormRoot(block.root);
            if (!root) {
                throw new EltNotFoundError(`Subform ${block.root} not found`, { block });
            }
            const form = this.formsService.createForm(root, authorId);

            if (FormUtils.isBlockHaveSubFormIndex(block)) {
                this.setSubFormFieldParentIndex(block.index, this.form.id, form);
            }

            this.newForms.push(form);
            this.newAssocs = [{ ref: this.form.id, form: form.id }];           

            FormWrapper.setFormValue(block.field, form.id, this.form);
        }
    }    

    private setSubFormFieldParentIndex(field: IndexType, parentIndex: IndexType, subForm: FormInstance) {
        const block = FormUtils.getBlockFromField(subForm, field);
        if (FormUtils.isBlockIndex(block)) {
            FormWrapper.setFormValue(field, parentIndex, subForm);
        }
    }   
}