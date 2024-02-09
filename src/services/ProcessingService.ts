import { AccountSettings, EltNotFoundError, FormUtils, FormWrapper, IndexType, Processing } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { FormsService } from "./FormsService";

@Service()
export class ProcessingService {

    @Inject(FormsService)
    private readonly formsService: FormsService;

    constructor() {

    }

    async start(processingId: IndexType, account: AccountSettings) {

        const procForm = await this.formsService.getFormQuery(processingId, { extMode: true });

        if (!procForm) {
            throw new EltNotFoundError(`Processing ${processingId} not found`, { id: processingId });
        }

        const endpoint = FormUtils.getFormField("endpoint", procForm);

        if (!endpoint) {
            throw new EltNotFoundError(`Processing ${processingId} has no endpoint defined`, { id: processingId });
        }              

        return this.formsService.sanitizeForm(procForm);
    }
}
