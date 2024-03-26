import { AccountSettings, IndexType } from "@codeffekt/ce-core-data";
import { Service } from "../core/CeService";
import { ProcessingOperator } from "../processing/ProcessingOperator";
import Axios, { AxiosRequestConfig } from "axios";

@Service()
export class ProcessingService {

    constructor() {
    }

    async start(processingId: IndexType, account: AccountSettings) {
        const processing = await ProcessingOperator.fromProcessingId(
            processingId, account);
        if (!processing.isStarted()) {
            await processing.setPendingStatus();
            await this.callApi(processing, () => processing.getApiStart());
        }
        return processing.getSanitizedForm();
    }

    async cancel(processingId: IndexType, account: AccountSettings) {
        const processing = await ProcessingOperator.fromProcessingId(
            processingId, account);
        if (processing.isStarted()) {
            await processing.setPendingStatus();
            await this.callApi(processing, () => processing.getApiCancel());
        }
        return processing.getSanitizedForm();
    }

    async status(processingId: IndexType, account: AccountSettings) {
        const processing = await ProcessingOperator.fromProcessingId(
            processingId, account);
        await this.callApi(processing, () => processing.getStatus());
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
