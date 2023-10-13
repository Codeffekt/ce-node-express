import {
    FormInstanceBase, FormBlock,
    FormInstance, IndexType,
    EltNotFoundError, IncorrectFormatError, FormWrapper, FormUtils
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormMutateFacade } from "./FormMutateFacade";

export class FormArrayCreateFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private root: FormInstanceBase;
    private arrayBlock: FormBlock;
    private form: FormInstance;
    private formElt: FormInstance;

    constructor(private pid: IndexType, private id: IndexType, private arrayField: string) { }

    async execute(author?: IndexType) {
        await this.retrieveForm();
        await this.retrieveFormArrayRoot();
        await this.createFormArrayElt();
        await this.updateForm(author);
        return this.formElt;
    }

    private async retrieveForm() {
        this.form = await this.formsService.getForm(this.id);
    }

    private async retrieveFormArrayRoot() {

        this.arrayBlock = FormUtils.getBlockFromField(this.form, this.arrayField);

        if (!this.arrayBlock) {
            throw new EltNotFoundError(`Block ${this.arrayField} does not exist`, this.arrayField);
        }

        if (this.arrayBlock.type !== 'formArray' || !this.arrayBlock.root || !this.arrayBlock.index) {
            throw new IncorrectFormatError(`Block ${this.arrayField} does not have sufficiant parameters`, this.arrayBlock);
        }

        this.root = await this.formsService.getFormRoot(this.arrayBlock.root);
    }

    private async createFormArrayElt() {
        const formMutate = new FormMutateFacade(this.pid, {
            type: 'form',
            op: 'create',
            root: this.root.id,
        });

        this.formElt = await formMutate.execute() as FormInstance;
    }

    private async updateForm(author: IndexType) {
        FormWrapper.setFormValue(this.arrayBlock.index, this.form.id, this.formElt);
        await this.formsService.updateForm(this.formElt, author);
    }
}