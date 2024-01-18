import {
    FormInstance, FormAssoc,
    
    FormWrapper, IndexType,
    getProjectCreator, EltNotFoundError, FormUtils, FormBlock,   
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsCreationResult } from "../core/core";
import { FormsService } from "../services/FormsService";
import { ProjectsService } from "../services/ProjectsService";
import { FormTemplateBuilder } from "./template/FormTemplateBuilder";

export type FormCreateActor = (newForm: FormInstance) => void;
export class FormCreateFacade {

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    private newForms: FormInstance[] = [];
    private newAssocs: FormAssoc[] = [];
    private project: FormInstance;
    private creator: FormBlock;
    private form: FormInstance;

    constructor(private actors: FormCreateActor[] = []) {
    }

    async createFromTemplate(template: IndexType, partialContent: any, author: IndexType): Promise<FormInstance> {
        const formTemplate = await this.formsService.getFormQuery(template, { extMode: true });
        if(!formTemplate) {
            throw new EltNotFoundError(`Cannot create form, form template ${template} not found`, { template });
        }
        const srcForm = FormUtils.getFormField("form", formTemplate);
        if(!srcForm) {
            throw new EltNotFoundError(`This template has no form field`, { template });
        }
        const builder = new FormTemplateBuilder();
        const formInstance = builder.fromForm(srcForm, partialContent, author);        

        this.applyRootFromTemplate(formTemplate, formInstance);

        return this.formsService.insertForm(formInstance, author);
    }    

    async createFromRoot(root: IndexType, partialContent: any, author: IndexType): Promise<FormInstance> {
        const formRoot = await this.formsService.getFormRoot(root);
        if (!formRoot) {
            throw new EltNotFoundError(`Cannot create form, form root ${root} not found`, { root });
        }
        const formInstance = this.formsService.createForm(formRoot, author);
        if (partialContent) {
            const formWrapper = new FormWrapper<any>({}, formInstance);
            formWrapper.updateProps(partialContent);
            formWrapper.fill();
        }        

        return this.formsService.insertForm(formInstance, author);
    }

    async create(pid: IndexType, creatorId: IndexType, author: IndexType): Promise<FormInstance> {

        try {
            await this.initAndCreate(pid, creatorId, author);
            await this.insertRequiredSubForms(author);
            await this.addFormsToProject();
        } catch (err) {
            console.error(err);
            throw err;
        }

        return this.form;
    }    

    async createBatched(pid: IndexType, creatorId: IndexType): Promise<FormsCreationResult> {
        try {
            await this.initAndCreate(pid, creatorId);
        } catch (err) {
            console.error(err);
            throw err;
        }

        return {
            res: this.form,
            assocs: this.newAssocs,
            forms: this.newForms
        };
    }

    private async initAndCreate(pid: IndexType, creatorId: IndexType, authorId?: IndexType) {
        await this.init(pid, creatorId);
        await this.createWrapper(authorId);
        await this.createRequiredSubForms(authorId);
        this.applyActors();
    }

    private async init(pid: IndexType, creatorId: IndexType) {
        this.newForms = [];
        this.newAssocs = [];
        this.project = await this.projectsService.getProject(pid);
        this.creator = getProjectCreator(this.project, creatorId);
    }    

    private async createWrapper(authorId: IndexType) {
        const root = await this.formsService.getFormRoot(this.creator.root);
        this.form = this.formsService.createForm(root, authorId);
    }

    private async insertRequiredSubForms(author?: IndexType) {
        if (this.newForms && this.newForms.length) {            
            await this.formsService.insertForms(this.newForms, author);
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

    private async addFormsToProject() {
        if (this.newAssocs && this.newAssocs.length) {
            await this.formsService.insertFormsAssoc(this.newAssocs);
        }
    }

    private async createRequiredSubForms(authorId: IndexType) {
        const requiredForms = this.formsService.getRequiredFormsFromRoot(this.form);

        this.newForms = [this.form];
        this.newAssocs = [{ ref: this.creator.params.ref, form: this.form.id }];

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

            if (form.table) {
                const formCreator = this.getCreatorFromFormTable(form);
                this.newAssocs.push({ ref: formCreator.params.ref, form: form.id });
            }

            FormWrapper.setFormValue(block.field, form.id, this.form);
        }
    }

    private getCreatorFromFormTable(form: FormInstance) {
        const formCreator = getProjectCreator(this.project, form.table);
        if (!formCreator) {
            throw new EltNotFoundError(`Form table ${form.table} not found in project ${this.project.id}`, { table: form.table, id: this.project.id });
        }
        return formCreator;
    }

    private setSubFormFieldParentIndex(field: IndexType, parentIndex: IndexType, subForm: FormInstance) {
        const block = FormUtils.getBlockFromField(subForm, field);
        if (FormUtils.isBlockIndex(block)) {
            FormWrapper.setFormValue(field, parentIndex, subForm);
        }
    }

    private applyRootFromTemplate(formTemplate: FormInstance, formInstance: FormInstance) {
        const newRoot = FormWrapper.getFormValue("root", formTemplate);
        if(newRoot) {
            formInstance.root = newRoot;
        }
    }
}