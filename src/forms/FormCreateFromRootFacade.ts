import { EltNotFoundError, FormAssoc, FormInstance, FormUtils, FormWrapper, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormTemplateBuilder } from "./template/FormTemplateBuilder";
import { FormCreateActor, FormCreatorBuilder } from "./FormCreatorActor";

export class FormCreateFromRootFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private newForms: FormInstance[] = [];
    private newAssocs: FormAssoc[] = [];
    private form: FormInstance;

    constructor(private actors: FormCreateActor[] = []) {

    }

    static fromPartialContent(root: IndexType, author: IndexType, partialContent?: any) {
        const creator = new FormCreateFromRootFacade(
            partialContent ? [ FormCreatorBuilder.fromPartialContent(root, partialContent) ] : [] 
          );
        return creator.createFromRoot(root, author);
    }

    async createFromRoot(root: IndexType, author: IndexType): Promise<FormInstance> {
        try {
            await this.createWrapper(root, author);
            await this.createRequiredSubForms(author);
            this.applyActors();
            await this.insertRequiredSubForms(author);            
            await this.addFormsToAssoc();
        } catch(err) {
            console.error(err);
        }

        return this.form;
    }

    private async createWrapper(root: IndexType, authorId: IndexType) {
        const formRoot = await this.formsService.getFormRoot(root);
        if (!formRoot) {
            throw new EltNotFoundError(`Cannot create form, form root ${root} not found`, { root });
        }
        const builder = new FormTemplateBuilder();
        this.form = builder.fromFormRoot(formRoot, undefined, authorId);
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

    private applyActors() {
        if (this.actors?.length && this.newForms?.length) {
            for (const actorFunction of this.actors) {
                for (const newForm of this.newForms) {
                    actorFunction(newForm);
                }
            }
        }
    }

    private setSubFormFieldParentIndex(field: IndexType, parentIndex: IndexType, subForm: FormInstance) {
        const block = FormUtils.getBlockFromField(subForm, field);
        if (FormUtils.isBlockIndex(block)) {
            FormWrapper.setFormValue(field, parentIndex, subForm);
        }
    }
}