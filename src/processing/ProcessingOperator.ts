import { AccountSettings, EltNotFoundError, FormInstanceExt, FormUtils, FormWrapper, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { FormsService } from "../services/FormsService";

export class ProcessingOperator {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    private form: FormInstanceExt;
    private endpoint: FormInstanceExt;

    private constructor(private pid: IndexType, private account: AccountSettings) {        
    }

    static async fromProcessingId(pid: IndexType, account: AccountSettings) {
        const operator = new ProcessingOperator(pid, account);
        await operator.retrieveProcessingData();
        return operator;
    }

    getSanitizedForm() {
        return this.formsService.sanitizeForm(this.form);
    }

    getApiStart(): string {
        return this.getApiEndpoint(`processing/${this.form.id}`);
    }

    getApiCancel(): string {
        return this.getApiEndpoint(`cancel`);
    }

    getStatus(): string {
        return this.getApiEndpoint(``);
    }

    getHeaders() {
        const token = FormWrapper.getFormValue("token", this.endpoint);
        return {
            headers: { Authorization: `Bearer ${token}` }
        };
    }

    isStarted() {
        const status = FormWrapper.getFormValue("status", this.form);
        return status === "PENDING" || status === "RUNNING";
    }

    async setPendingStatus() {
        FormWrapper.setFormValue("status", "PENDING", this.form);
        await this.formsService.updateForm(this.getSanitizedForm(), this.account.id);
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