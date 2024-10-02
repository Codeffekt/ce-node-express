import { FormsService } from "../services/FormsService";
import { Inject } from "../core/CeService";
import { FormInstance } from "@codeffekt/ce-core-data";
import { FormCreateActor } from "./FormCreatorActor";

export class FormCreateOnAccountFacade {

    @Inject(FormsService)
    private readonly formsService: FormsService;    

    private newForms: FormInstance[] = [];
    private form: FormInstance;

    constructor(private actors: FormCreateActor[] = []) {
    }

    


}