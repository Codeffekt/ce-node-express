import { Response, NextFunction } from "express";

import { Service } from "../core/CeService";
import { Controller, Use } from "../express-router/ExpressRouter";
import { CeApiModule } from "../express-router/ApiModule";
import { PublicProject } from "../project/PublicProject";
import { PublicAccounts } from "../account/PublicAccounts";
import { PublicAssets } from "../assets/PublicAssets";
import { PublicForms } from "../forms/PublicForms";
import { JwtUserRequest } from "../core/Auth";
import { PublicFormsVersion } from "../forms/PublicFormsVersion";
import { PublicFormsApiToken } from "../tokens/PublicFormsApiToken";

@Service()
@Controller({ path: '/api/' })
@CeApiModule({
    components: [
        PublicProject,
        PublicAccounts,
        PublicAssets,
        PublicForms, 
        PublicFormsVersion,
        PublicFormsApiToken,       
    ]
})
export class FormsApiServer {

    constructor() {
    }

    @Use({ path: '/' } as any)
    async callApi(req: JwtUserRequest, res: Response, next: NextFunction) {               
        this.__callApi(req, res, next);
    }

    async __callApi(req: JwtUserRequest, res: Response, next: NextFunction) {
        throw new Error(`Must be overloaded by CeApiModule`);
    }
}