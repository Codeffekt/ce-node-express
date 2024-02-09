import { 
    FormInstance, FormUtils, 
    FormWrapper, FORM_BLOCK_TYPE_ASSET_ARRAY, FORM_BLOCK_TYPE_FORM_ARRAY, 
    FORM_BLOCK_TYPE_FORM_ASSOC, 
    FormRoot} from "@codeffekt/ce-core-data";
import { Inject } from "../../core/CeService";
import { FormsService } from "../../services/FormsService";

export class FormTemplateBuilder {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    constructor() {}

    fromForm(srcForm: FormInstance, partialContent: any, author: string) {
        const formInstance = this.fromFormRoot(srcForm, partialContent, author);        
        formInstance.root = srcForm.root;
        return formInstance;
    }

    fromFormRoot(srcForm: FormRoot, partialContent: any, author: string) {
        const formInstance = this.formsService.createForm(srcForm, author);
        if (partialContent) {
            const formWrapper = new FormWrapper({}, formInstance);
            formWrapper.updateProps(partialContent);
            formWrapper.fill();
        }                

        this.replaceFormArrayRefs(formInstance);
        this.replaceFormAssetValues(formInstance);

        return formInstance;
    }

    private replaceFormArrayRefs(form: FormInstance) {
        const formBlocks = FormUtils.getBlocksAsArray(form)
        .filter(block =>
            block.type === FORM_BLOCK_TYPE_FORM_ARRAY ||
            block.type === FORM_BLOCK_TYPE_FORM_ASSOC
        ).filter(block => block.params?.ref !== undefined);

        for(const block of formBlocks) {
            block.params.ref = FormUtils.parseValue(form, block.params.ref);
        }        
    }

    private replaceFormAssetValues(form: FormInstance) {
        const formBlocks = FormUtils.getBlocksAsArray(form)
        .filter(block =>
            block.type === FORM_BLOCK_TYPE_ASSET_ARRAY            
        ).filter(block => block.value !== undefined);

        for(const block of formBlocks) {
            block.value = FormUtils.parseValue(form, block.value);
        }    
    }
}