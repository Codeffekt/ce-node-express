import { FormsService } from "../services/FormsService";
import { Inject } from "../core/CeService";
import { FormCreateActor } from "./FormCreateFacade";
import { FormInstance } from "@codeffekt/ce-core-data";

export class FormCreateOnAccountFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    private newForms: FormInstance[] = [];
    private form: FormInstance;

    constructor(private actors: FormCreateActor[] = []) {
    }

    


}