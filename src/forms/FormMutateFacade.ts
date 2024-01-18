import { FormCreateFacade } from "./FormCreateFacade";
import { FormDeleteFacade } from "./FormDeleteFacade";
import { FormArrayCreateFacade } from "./FormArrayCreateFacade";
import {
    FormInstanceBase, IndexType,
    FormMutate, InvalidParamError,
    EltNotFoundError, IncorrectFormatError,
    FormInstance, FormWrapper, getProjectCreator
} from "@codeffekt/ce-core-data";
import { FormForkFacade } from "./FormForkFacade";
import { FormAssocDelete } from "./FormAssocDelete";
import { FormAssocAdd } from "./FormAssocAdd";
import { FormUpgradeFacade } from "./FormUpgradeFacade";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormUpdateFacade } from "./FormUpdateFacade";

export class FormMutateFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    private root: FormInstanceBase;
    private creatorId: IndexType;

    constructor(private pid: IndexType, private mutation: FormMutate) {

    }

    async execute() {
        if (this.mutation.type === "form") {
            return this.executeOnTypeForm();
        } else if (this.mutation.type === "formArray") {
            return this.executeOnTypeFormArray();
        } else if (this.mutation.type === "formAssoc") {
            return this.executeOnTypeFormAssoc();
        } else {
            throw new IncorrectFormatError(`Invalid mutation type ${this.mutation.type}`);
        }
    }

    private executeOnTypeForm() {
        if (this.mutation.op === "create") {
            return this.executeFormCreation();
        } else if (this.mutation.op === "delete") {
            return this.executeFormDelete();
        } else if (this.mutation.op === "update") {
            return this.executeFormUpdate();
        } else if (this.mutation.op === "fork") {
            return this.executeFormFork();
        } else if (this.mutation.op === "upgrade") {
            return this.executeFormUpgrade();
        } else {
            throw new IncorrectFormatError(`Invalid mutation op ${this.mutation.op} on type form`);
        }
    }

    private executeOnTypeFormArray() {
        if (this.mutation.op === "create") {
            return this.executeFormArrayCreation();
        } else {
            throw new IncorrectFormatError(`Invalid mutation op ${this.mutation.op} on type formArray`);
        }
    }

    private executeOnTypeFormAssoc() {
        if (this.mutation.op === "add") {
            return this.executeFormAssocAdd();
        } else if (this.mutation.op === "delete") {
            return this.executeFormAssocDelete();
        } else {
            throw new IncorrectFormatError(`Invalid mutation op ${this.mutation.op} on type formAssoc`);
        }
    }

    private async executeFormCreation() {
        await this.createRoot();
        const actors = this.mutation.props?.length ?
            this.mutation.props.map((elt) => (form: FormInstance) => {
                if (form.root === elt.root) {
                    FormWrapper.setFormValues(elt.props, form);
                }
            }) : [];
        const formBuilder = new FormCreateFacade(actors);
        return formBuilder.create(this.pid, this.creatorId, this.mutation.author);
    }

    private async executeFormDelete() {

        await this.checkIndices();
        await this.createRootMutationFromIndices();
        await this.createRoot();

        const formDelete = new FormDeleteFacade(this.mutation.fields?.includes, this.mutation.fields?.excludes);
        return formDelete.execute(this.pid, this.creatorId, this.mutation.indices[0]);
    }

    private async executeFormArrayCreation() {

        this.checkIndices();
        this.checkArrayField();
        const formArrayCreate = new FormArrayCreateFacade(this.pid, this.mutation.indices[0], this.mutation.formArrayField);
        return formArrayCreate.execute(this.mutation.author);
    }

    private async executeFormUpdate() {
        this.checkElts();
        const updater = new FormUpdateFacade();
        return updater.executeFromForms(this.mutation.elts, this.mutation.author);
    }

    private async executeFormFork() {
        this.checkIndices();
        await this.setRootFromForm(this.mutation.indices[0]);
        await this.createRoot();
        const formFork = new FormForkFacade(this.mutation.fields?.includes, this.mutation.fields?.excludes);
        return formFork.create({
            pid: this.pid,
            fid: this.mutation.indices[0],
            creatorId: this.creatorId
        });
    }

    private async executeFormUpgrade() {
        this.checkIndices();
        await this.createRoot({ checkTable: false });
        const op = new FormUpgradeFacade(this.mutation.author);
        return op.upgrade(this.root, this.mutation.indices);
    }

    private async executeFormAssocAdd() {
        this.checkIndices();
        this.checkRefField();
        const op = new FormAssocAdd();
        return op.add(this.mutation.ref, this.mutation.indices, this.mutation.formArrayField);
    }

    private async executeFormAssocDelete() {
        this.checkIndices();
        this.checkRefField();
        const op = new FormAssocDelete();
        return op.delete(this.mutation.ref, this.mutation.indices, this.mutation.formArrayField);
    }

    private async setRootFromForm(id: IndexType) {
        const form = await this.formsService.getForm(id);
        if (!form || !form.root) {
            throw new EltNotFoundError(`Form ${id} not found or does not have root`, { id });
        }
        this.mutation.root = form.root;
    }

    private checkElts() {
        if (!this.mutation.elts || !this.mutation.elts.length) {
            throw new InvalidParamError(`Mutation does not have elts`);
        }
    }

    private checkIndices() {
        if (!this.mutation.indices || !this.mutation.indices.length) {
            throw new InvalidParamError(`Mutation does not have indices`);
        }
    }

    private checkArrayField() {
        if (!this.mutation.formArrayField) {
            throw new InvalidParamError(`Mutation does not have formArrayField`);
        }
    }

    private checkRefField() {
        if (!this.mutation.ref) {
            throw new InvalidParamError(`Mutation does not have ref`);
        }
    }

    private async createRoot(options: { checkTable: boolean } = { checkTable: true }) {
        if(this.mutation.rootField) {
            await this.createRootWithRootField();
        } else {
            await this.createRootWithTable(options);
        }
    }

    private async createRootWithTable(options: { checkTable: boolean } = { checkTable: true }) {
        if (!this.mutation.root) {
            throw new InvalidParamError(`Mutation does not have a root id`);
        }

        this.root = await this.formsService.getFormRoot(this.mutation.root);

        if (!this.root) {
            throw new EltNotFoundError(`Form root ${this.mutation.root} not found`, this.root);
        }

        if (this.pid && options.checkTable && !this.root.table) {
            throw new IncorrectFormatError(`Root ${this.root} does not have a table reference`);
        }

        this.creatorId = this.root.table;
    }

    private async createRootWithRootField() {
        if (!this.mutation.rootField) {
            throw new InvalidParamError(`Mutation does not have a creator Id`);
        }

        const project = await this.formsService.getForm(this.pid);

        if(!project) {
            throw new EltNotFoundError(`Form (project) ${this.pid} not found`, this.pid);
        }

        const creator = getProjectCreator(project, this.mutation.rootField);

        this.root = await this.formsService.getFormRoot(creator.root);

        if (!this.root) {
            throw new EltNotFoundError(`Form root ${creator.root} not found`, creator);
        }

        this.creatorId = this.mutation.rootField;
    }

    private async createRootMutationFromIndices() {
        const form = await this.formsService.getForm(this.mutation.indices[0]);
        this.mutation.root = form.root;
    }
}