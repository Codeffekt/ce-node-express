import {
    IndexType,
    FormInstance,
    EltNotFoundError,
    FormUtils, FormAssoc, FormBlock
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { ForkFieldsUtils } from "./ForkFieldsUtils";

export class FormDeleteFacade {   

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private id: IndexType;    
    private form: FormInstance;

    private deletedAssocs: FormAssoc[] = [];
    private deletedFormIds: IndexType[] = [];

    constructor(private includesFields?: IndexType[], private excludesFields?: IndexType[]) { }

    async execute(id: IndexType) {

        await this.init(id);
        await this.retrieveForm();
        await this.deleteArrayFields();       
        await this.deleteSubForms();
        await this.deleteFormsAssocs();    
        await this.deleteForms();

        return true;

    }

    private async init(id: IndexType) {
        this.id = id;      
        this.deletedAssocs = [];
        this.deletedFormIds = [];
    }

    private async retrieveForm() {
        this.form = await this.formsService.getForm(this.id);

        if (!this.form) {
            throw new EltNotFoundError(`Cannot find form ${this.id}`, { id: this.id });
        }
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
        if(block.params.ref) {
            return;
        }

        const ref = FormUtils.createFormAssocRef(this.id, block.field);
        await this.formsService.deleteFormsAssoc(ref);
    }

    private async deleteFormsAssocs() {
        await this.formsService.deleteFormsAssocs(this.deletedAssocs);
        await this.formsService.deleteFormsAssocFromForm(this.id);
    }

    private async deleteForms() {
        await this.formsService.deleteForms(this.deletedFormIds);
    }
}