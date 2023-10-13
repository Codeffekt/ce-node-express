import {
    FormInstance, FormWrapper, IndexType,
    FormBlock,
    FormUtils,
    FormAssoc,
    EltNotFoundError,
    IncorrectFormatError,
    getProjectCreator,
    FormInstanceBase,
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsCreationResult } from "../core/core";
import { FormsService } from "../services/FormsService";
import { ProjectsService } from "../services/ProjectsService";
import { ForkFieldsUtils } from "./ForkFieldsUtils";

const ARRAY_COPY_FORMS_LIMIT = 40;
const ARRAY_COPY_ASSOCS_LIMIT = 40;

export interface CreateOptions {
    pid: IndexType;
    fid: IndexType;
    creatorId?: IndexType;
    block?: FormBlock;
    parent?: FormInstance;
}

export class FormForkFacade {

    private newForms: FormInstance[] = [];
    private newAssocs: FormAssoc[] = [];
    private project: FormInstance;
    private formSource: FormInstance;
    private formForked: FormInstance;

    @Inject(ProjectsService)
    private readonly projectsService: ProjectsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    constructor(private forkIncludesFields?: IndexType[], private forkExcludesFields?: IndexType[]) {
    }

    async create(options: CreateOptions): Promise<FormInstance> {

        await this.initAndCreate(options);
        await this.insertRequiredSubForms(options.creatorId);
        await this.addFormsToProject();

        return this.formsService.sanitizeForm(this.formForked);
    }

    async createBatched(options: CreateOptions): Promise<FormsCreationResult> {

        await this.initAndCreate(options);

        return {
            res: this.formsService.sanitizeForm(this.formForked),
            assocs: this.newAssocs,
            forms: this.newForms
        };
    }

    private async initAndCreate(options: CreateOptions) {
        await this.init(options.pid, options.fid);
        await this.createForm(options);
        await this.copyArrayFields();
        await this.copyAssocFields();
    }

    private async init(pid: IndexType, fid: IndexType) {
        this.newForms = [];
        this.newAssocs = [];
        this.project = await this.projectsService.getProject(pid);
        this.formSource = await this.formsService.getFormQuery(fid, { extMode: true });
    }

    private async createForm(options: CreateOptions) {

        const root = await this.formsService.getFormRoot(this.formSource.root);
        if (!root) {
            throw new EltNotFoundError(`Subform ${root} not found`, { root });
        }
        this.formForked = this.formsService.createForm(root);
        ForkFieldsUtils.syncForms(this.formSource, this.formForked, this.forkIncludesFields, this.forkExcludesFields);
        this.setParentField(options);
        this.newForms.push(this.formForked);

        if (root.table) {
            const formCreator = this.getCreatorFromFormTable(this.formForked);
            this.newAssocs.push({ ref: formCreator.params.ref, form: this.formForked.id });
        }

        const requiredForms = this.formsService.getRequiredFormsFromRoot(this.formForked);
        for (const block of requiredForms) {
            const requiredFormSource = FormUtils.getFormField(block.field, this.formSource);

            if (!requiredFormSource) {
                throw new IncorrectFormatError(`Forked form missing required form ${block.field}`, block);
            }

            const builder = new FormForkFacade(
                ForkFieldsUtils.removeFieldPath(block.field, this.forkIncludesFields),
                ForkFieldsUtils.removeFieldPath(block.field, this.forkExcludesFields)
            );
            const batch = await builder.createBatched({
                pid: this.project.id,
                fid: requiredFormSource.id,
                block,
                parent: this.formForked,
            });
            FormWrapper.setFormValue(block.field, batch.res.id, this.formForked);
            this.newForms = this.newForms.concat(batch.forms);
            this.newAssocs = this.newAssocs.concat(batch.assocs);
        }
    }

    private setParentField({ block, parent }: CreateOptions) {

        if (!parent || !block?.required || !block?.index) {
            return;
        }

        FormWrapper.setFormValue(block.index, parent.id, this.formForked);
    }

    private async copyArrayFields() {

        if (!this.forkIncludesFields || !this.forkIncludesFields.length) {
            return;
        }

        const predWithFields = ForkFieldsUtils.getPredicateWithFields(
            this.forkIncludesFields, this.forkExcludesFields
        );
        const predArray = ForkFieldsUtils.getPredicateArray();

        const arrayBlocks = Object.values(this.formForked.content).filter(
            block => predArray(block) && predWithFields(block)
        );

        for (const arrayblock of arrayBlocks) {
            await this.copyArray(arrayblock);
        }
    }

    private async copyAssocFields() {

        if (!this.forkIncludesFields || !this.forkIncludesFields.length) {
            return;
        }

        const predWithFields = ForkFieldsUtils.getPredicateWithFields(
            this.forkIncludesFields, this.forkExcludesFields
        );
        const predArray = ForkFieldsUtils.getPredicateAssoc();

        const arrayBlocks = Object.values(this.formForked.content).filter(
            block => predArray(block) && predWithFields(block)
        );

        for (const arrayblock of arrayBlocks) {
            await this.copyAssoc(arrayblock);
        }
    }

    private async copyAssoc(block: FormBlock) {
        const res = await this.formsService.getFormAssocs({
            ref: FormUtils.createFormAssocRef(this.formSource.id, block.field),
            limit: ARRAY_COPY_ASSOCS_LIMIT,
            offset: 0
        });

        if (!res.elts || !res.elts.length) {
            return;
        }

        const dstRef = FormUtils.createFormAssocRef(this.formForked.id, block.field);

        await this.formsService.insertFormsAssoc(res.elts.map(fa => ({
            ref: dstRef,
            form: fa.form
        })));
    }

    private async copyArray(block: FormBlock) {

        const root = await this.formsService.getFormRoot(block.root);

        if (!root) {
            throw new EltNotFoundError(`Form root ${root} not found`, root);
        }

        if (!root.table) {
            throw new IncorrectFormatError(`Root ${root} does not have a table reference`);
        }

        const creator = this.getCreatorFromFormTable(root);

        const res = await this.formsService.getFormsQuery({
            ref: creator.params.ref,
            queryFields: [
                {
                    op: "=",
                    field: block.index,
                    value: this.formSource.id,
                },
                {
                    field: 'root',
                    onMeta: true,
                    op: '=',
                    value: block.root
                }
            ],
            offset: 0,
            limit: ARRAY_COPY_FORMS_LIMIT
        });        

        if (!res.elts || !res.elts.length) {
            return;
        }

        const builder = new FormForkFacade(
            ForkFieldsUtils.removeFieldPath(block.field, this.forkIncludesFields),
            ForkFieldsUtils.removeFieldPath(block.field, this.forkExcludesFields)
        );

        for (const arrayForm of res.elts) {
            const batch = await builder.createBatched({
                pid: this.project.id,
                fid: arrayForm.id,
                creatorId: root.table,
                block
            });
            const newForm = batch.res;
            FormWrapper.setFormValue(block.index, this.formForked.id, newForm);
            this.newForms = this.newForms.concat(batch.forms);
            this.newAssocs = this.newAssocs.concat(batch.assocs);
        }
    }

    private async insertRequiredSubForms(author: IndexType) {
        if (this.newForms && this.newForms.length) {
            await this.formsService.insertForms(this.newForms, author);
        }
    }

    private async addFormsToProject() {
        if (this.newAssocs && this.newAssocs.length) {
            await this.formsService.insertFormsAssoc(this.newAssocs);
        }
    }

    private getCreatorFromFormTable(form: FormInstanceBase) {
        const formCreator = getProjectCreator(this.project, form.table);
        if (!formCreator) {
            throw new EltNotFoundError(`Form table ${form.table} not found in project ${this.project.id}`, { table: form.table, id: this.project.id });
        }
        return formCreator;
    }
}

