import {
    FormQuery
} from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { CeApiAdmin, CeApiCall, CeApiComponent } from "../express-router/ApiModule";
import { FormsVersionService } from "../services/FormsVersionService";

@CeApiComponent()
export class PublicFormsVersion {

    @Inject(FormsVersionService)
    private readonly formsVersion: FormsVersionService;

    constructor() { }

    @CeApiCall
    @CeApiAdmin
    getFormsQuery(query: FormQuery) {
        return this.formsVersion.getFormsQuery({ limit: 0, offset: 0, ...query });
    }
}

