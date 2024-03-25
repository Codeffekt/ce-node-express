import { EltNotFoundError, FormInstanceExt, FormUtils, FormWrapper, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class ProcessingOperator {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private form: FormInstanceExt;
    private endpoint: FormInstanceExt;

    private constructor(private pid: IndexType) {        
    }

    static async fromProcessingId(pid: IndexType) {
        const operator = new ProcessingOperator(pid);
        await operator.retrieveProcessingData();
        return operator;
    }

    getSanitizedForm() {
        return this.formsService.sanitizeForm(this.form);
    }

    getApiStart(): string {
        return this.getApiEndpoint(`start/${this.form.id}`);
    }

    getApiCancel(): string {
        return this.getApiEndpoint(`cancel`);
    }

    getSelf(): string {
        return this.getApiEndpoint(`self`);
    }

    getHeaders() {
        const token = FormWrapper.getFormValue("token", this.endpoint);
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    private getApiEndpoint(endpoint: string) {
        const server = FormWrapper.getFormValue("server", this.endpoint);
        return `${server}/${endpoint}`;
    }

    private async retrieveProcessingData() {

        this.form = await this.formsService.getFormQuery(this.pid, { extMode: true });

        if (!this.form) {
            throw new EltNotFoundError(`Processing ${this.pid} not found`, { id: this.pid });
        }

        this.endpoint = FormUtils.getFormField("endpoint", this.form);

        if (!this.endpoint) {
            throw new EltNotFoundError(`Processing ${this.pid} has no endpoint defined`, { id: this.pid });
        }                     
    }
}