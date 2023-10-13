import { EltNotFoundError, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class FormCopyFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    constructor() {}

    async copy(srcId: IndexType, author: IndexType) {
        const srcForm = await this.formsService.getForm(srcId);
        if(!srcForm) {
            throw new EltNotFoundError(`Cannot copy form, form ${srcId} not found`, { srcId });
        }
        const formInstance = this.formsService.createForm(srcForm, author); 
        formInstance.root = srcForm.root;          
        return this.formsService.insertForm(formInstance, author);
    }
}