import { EltNotFoundError, FormBlock, FormInstance, FormUtils, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class AssetsArrayRef {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    public form: FormInstance;
    public block: FormBlock;
    public ref: IndexType;

    private constructor(private formId: IndexType, private field: IndexType) {
        
    }

    static async fromAssetsArray(formId: IndexType, field: IndexType) {
        const ref = new AssetsArrayRef(formId, field);
        await ref.create();
        return ref;
    }

    private async create() {
        await this.retrieveForm();
        await this.retrieveBlock();
        this.retrieveRef();        
    }

    private async retrieveForm() {
        this.form = await this.formsService.getForm(this.formId);

        if (!this.form) {
            throw new EltNotFoundError(`Form ${this.formId} not found`, { id: this.formId });
        }
    }

    private async retrieveBlock() {
        this.block = FormUtils.getBlockFromField(this.form, this.field);

        if (!this.block) {
            throw new EltNotFoundError(`Block ${this.field} not found in form ${this.formId}`, {
                id: this.formId,
                field: this.field
            });
        }

        if (this.block.type !== "assetArray") {
            throw new Error(`Block ${this.field} is not of type assetArray, value ${this.block.type}`);
        }
    }

    private retrieveRef() {
        this.ref = this.block.value === undefined ? `${this.field}-${this.form.id}` :
            FormUtils.parseValue(this.form, this.block.value);
    }
}