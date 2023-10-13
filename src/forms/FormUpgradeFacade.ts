import {
    EltNotFoundError, FormBlock,
    FormInstance, FormInstanceBase,
    FormUtils,
    FormWrapper, 
    IndexType, Utils
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

function updateBlock(oldBlock: FormBlock, newBlock: FormBlock) {
    return {
        ...newBlock,
        // do not update the block value if already there    
        value: oldBlock.value === undefined ? newBlock.value : oldBlock.value
    };
}

export class FormUpgradeFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    private newForms: FormInstance[] = [];

    constructor(private authorId?: IndexType) { }

    async upgrade(root: FormInstanceBase, indices: IndexType[]) {

        this.newForms = [];

        const forms = await this.formsService.getFormsQuery({
            formRoot: root.id,
            indices
        });

        if (!forms.elts.length) {
            return;
        }

        for (const form of forms.elts) {
            await this.applyFormRoot(root, form);
        }

        await this.insertForms();
    }

    /**
     * 
     * @param root 
     * @param form 
     * Update label, unit, defaultValue and type fields of all forms related to the specified form root.
     * Remove non existing block. Add new block.
     */
    private async applyFormRoot(root: FormInstanceBase, form: FormInstance) {

        const requiredSubForms = this.getRequiredSubForms(root, form);

        this.mergeForms(root, form);

        await this.checkRequiredSubForms(form, requiredSubForms);

        this.newForms.push(form);
    }

    private async insertForms() {
        if (this.newForms && this.newForms.length) {            
            await this.formsService.insertForms(this.newForms, this.authorId);
        }
    }

    private mergeForms(root: FormInstanceBase, form: FormInstance) {

        const rootCopy = Utils.deepcopy(root);

        form.title = root.title;
        if (rootCopy.table) form.table = rootCopy.table;
        form.content = {
            ...rootCopy.content,
            ...
            // updated blocks
            Object.keys(rootCopy.content)
                .filter(field => form.content[field] !== undefined)
                .reduce((prev, cur) => ({ ...prev, [cur]: updateBlock(form.content[cur], rootCopy.content[cur]) }), {})
        };
    }

    private getRequiredSubForms(root: FormInstanceBase, form: FormInstance) {
        const prevRequired = this.formsService.getRequiredFormsFromRoot(form);
        const curRequired = this.formsService.getRequiredFormsFromRoot(root);
        return curRequired
            .filter(curBlock => !prevRequired.find(prevBlock => prevBlock.field === curBlock.field));
    }

    private async checkRequiredSubForms(form: FormInstance, requiredForms: FormBlock[]) {
        for (const block of requiredForms) {
            const root = await this.formsService.getFormRoot(block.root);
            if (!root) {
                throw new EltNotFoundError(`Subform ${block.root} not found`, { block });
            }
            const subForm = this.formsService.createForm(root, this.authorId);

            if (subForm.table) {
                continue; // cannot upgrade form with table because we don't have any project here
            }

            if (FormUtils.isBlockHaveSubFormIndex(block)) {
                this.setSubFormFieldParentIndex(block.index, form.id, form);
            }

            this.newForms.push(subForm);

            FormWrapper.setFormValue(block.field, subForm.id, form);
        }
    }

    private setSubFormFieldParentIndex(field: IndexType, parentIndex: IndexType, subForm: FormInstance) {
        const block = FormUtils.getBlockFromField(subForm, field);
        if (FormUtils.isBlockIndex(block)) {
            FormWrapper.setFormValue(field, parentIndex, subForm);
        }
    }
}