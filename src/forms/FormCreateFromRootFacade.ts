import {
    EltNotFoundError, FormInstance,
    FormsBatchData, FormUtils,
    FormWrapper, IndexType
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormTemplateBuilder } from "./template/FormTemplateBuilder";
import { FormCreateActor, FormCreatorBuilder } from "./FormCreatorActor";

export interface FormCreateFromRootFacadeOptions {
    actors: FormCreateActor[];
    flushCreatedData: boolean;
}

export class FormCreateFromRootFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private newData: FormsBatchData = {
        forms: [],
        assocs: []
    };

    private form: FormInstance;

    constructor(private options: FormCreateFromRootFacadeOptions) {

    }

    static async fromPartialContent(root: IndexType, author: IndexType, partialContent?: any) {
        const creator = new FormCreateFromRootFacade({
            actors: partialContent ? [FormCreatorBuilder.fromPartialContent(root, partialContent)] : [],
            flushCreatedData: true
        });
        const form = await creator.createFromRoot(root, author);
        return form;
    }

    async createFromRoot(root: IndexType, author: IndexType): Promise<FormInstance> {
        try {
            await this.createWrapper(root, author);
            await this.createRequiredSubForms(author);
            this.applyActors();
            if (this.options.flushCreatedData) {
                await this.flushNewCreatedData(author);
            }
        } catch (err) {
            console.error(err);
        }

        return this.form;
    }

    getNewCreatedData() {
        return this.newData;
    }

    private async flushNewCreatedData(author: IndexType) {
        await this.insertRequiredSubForms(author);
        await this.addFormsToAssoc();
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
        if (this.newData.forms.length) {
            await this.formsService.insertForms(this.newData.forms, author);
        }
    }

    private async addFormsToAssoc() {
        if (this.newData.assocs.length) {
            await this.formsService.insertFormsAssoc(this.newData.assocs);
        }
    }

    private async createRequiredSubForms(authorId: IndexType) {
        const requiredForms = this.formsService.getRequiredFormsFromRoot(this.form);

        this.newData = {
            main: this.form,
            forms: [this.form],
            assocs: []
        };

        for (const block of requiredForms) {
            const root = await this.formsService.getFormRoot(block.root);
            if (!root) {
                throw new EltNotFoundError(`Subform ${block.root} not found`, { block });
            }
            const form = this.formsService.createForm(root, authorId);

            if (FormUtils.isBlockHaveSubFormIndex(block)) {
                this.setSubFormFieldParentIndex(block.index, this.form.id, form);
            }

            this.newData.forms.push(form);
            this.newData.assocs.push({ ref: this.form.id, form: form.id });

            FormWrapper.setFormValue(block.field, form.id, this.form);
        }
    }

    private applyActors() {
        if (this.options.actors?.length && this.newData.forms.length) {
            for (const actorFunction of this.options.actors) {
                for (const newForm of this.newData.forms) {
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