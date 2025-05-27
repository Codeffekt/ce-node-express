import {
    FormInstanceBase, FormBlock,
    FormInstance, IndexType,
    EltNotFoundError, IncorrectFormatError, FormUtils
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormMutateFacade } from "./FormMutateFacade";

export class FormArrayCreateFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private formRoot: FormInstanceBase;
    private arrayBlock: FormBlock;
    private form: FormInstance;
    private formElt: FormInstance;

    constructor(private pid: IndexType, private id: IndexType, private arrayField: string, private root?: IndexType) { }

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

        if (this.arrayBlock.type !== 'formArray') {
            throw new IncorrectFormatError(`Block ${this.arrayField} is not a formArray type`, this.arrayBlock);
        }

        if(!this.arrayBlock.root) {
            throw new IncorrectFormatError(`Block ${this.arrayField} has not root property`, this.arrayBlock);
        }

        if(this.arrayBlock.params?.useCategory && !this.root) {
            throw new IncorrectFormatError(`Block ${this.arrayField} uses category but no root was specified`, this.arrayBlock);
        }

        const root = this.arrayBlock.params?.useCategory ? this.root : this.arrayBlock.root;

        this.formRoot = await this.formsService.getFormRoot(root);       
    }

    private async createFormArrayElt() {
        const formMutate = new FormMutateFacade(this.pid, {
            type: 'form',
            op: 'create',
            root: this.formRoot.id,
        });

        this.formElt = await formMutate.execute() as FormInstance;
    }

    private async updateForm(author: IndexType) {        
        await this.formsService.insertFormAssoc({
            ref: this.arrayBlock.params?.ref ?? FormUtils.createFormAssocRef(this.form.id, this.arrayBlock.field),
            form: this.formElt.id,
        });
        await this.formsService.updateForm(this.formElt, author);
    }
}