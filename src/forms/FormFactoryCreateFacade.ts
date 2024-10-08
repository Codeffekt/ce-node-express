import { EltNotFoundError, FormBlock, FormInstance, FormUtils, IncorrectFormatError, IndexType } from "@codeffekt/ce-core-data";
import { FormCreateActor } from "./FormCreatorActor";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";
import { FormCreateFromRootFacade } from "./FormCreateFromRootFacade";

export class FormFactoryCreateFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    private srcForm: FormInstance;
    private factoryBlock: FormBlock;
    private targetBlock: FormBlock;    

    constructor(private actors: FormCreateActor[] = []) {

    }

    async createFromFormBlock(formId: IndexType, field: IndexType, author: IndexType): Promise<FormInstance> {
        await this.init(formId, field);
        const updatedForm = await this.createForm(author);
        return updatedForm;
    }

    private async init(formId: IndexType, field: IndexType) {
        
        this.srcForm = await this.formsService.getForm(formId);

        if(!this.srcForm) {
            throw new EltNotFoundError(`Form ${formId} not found`, formId);
        }

        this.factoryBlock = FormUtils.getBlockFromField(this.srcForm, field);

        if(!this.factoryBlock) {
            throw new EltNotFoundError(`Form factory block ${field} not found`, { formId, field });
        }

        if(this.factoryBlock.type !== 'factory') {
            throw new IncorrectFormatError(`Block ${field} is not a factory type`);
        }

        if(!this.factoryBlock.value) {
            throw new IncorrectFormatError(`Factory block ${field} does not have any value`);
        }

        if(!this.factoryBlock.params?.target) {
            throw new IncorrectFormatError(`Factory block ${field} does not have target params value`);
        }        

        this.targetBlock = FormUtils.getBlockFromField(this.srcForm, this.factoryBlock.params?.target);

        if(!this.targetBlock) {
            throw new IncorrectFormatError(`Factory block ${field}, target ${this.factoryBlock.params.target} not found`);
        }
    }

    private async createForm(author: IndexType) {
        const creator = new FormCreateFromRootFacade(this.actors);
        const newForm = await creator.createFromRoot(this.factoryBlock.value, author);
        this.targetBlock.root = newForm.root;
        this.targetBlock.value = newForm.id;
        return this.formsService.updateForm(this.srcForm, author);
    }
}