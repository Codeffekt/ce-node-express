import { AccountSettings, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { FormsService } from "./FormsService";
import { ProcessingOperator } from "../processing";
import Axios, { AxiosRequestConfig } from "axios";

@Service()
export class ProcessingService {

    @Inject(FormsService)
    private readonly formsService: FormsService;
s
    constructor() {

    }

    async start(processingId: IndexType, account: AccountSettings) {
        const processing = await ProcessingOperator.fromProcessingId(processingId);
        await this.callApi(processing, () => processing.getApiStart());
        return processing.getSanitizedForm();
    }

    async cancel(processingId: IndexType) {
        const processing = await ProcessingOperator.fromProcessingId(processingId);
        await this.callApi(processing, () => processing.getApiCancel());
        return processing.getSanitizedForm();
    }

    async status(processingId: IndexType) {
        const processing = await ProcessingOperator.fromProcessingId(processingId);
        await this.callApi(processing, () => processing.getSelf());
        return processing.getSanitizedForm();
    }

    private callApi(pop: ProcessingOperator, apiFunc: () => string) {
        return this._call_rest_get(
            apiFunc(),
            pop.getHeaders()
        )
    }

    private _call_rest_get(url: string, options: AxiosRequestConfig) {
        return Axios.get<any>(
            url,
            options
        );
    }

    
}
