import {
    FormQuery  } from "@codeffekt/ce-core-data";
  import { Inject } from "../core/CeService";
  import { 
    
    CeApiCall, 
    CeApiComponent  } from "../express-router/ApiModule";
  import { FormsRootService } from "../services/FormsRootService";
  
  @CeApiComponent()
  export class PublicFormsRoot {
    
  
    @Inject(FormsRootService)
    private readonly formsRootService: FormsRootService;
  
    constructor() { }          
  
    @CeApiCall
    getFormsQuery(query: FormQuery) {
      return this.formsRootService.getFormsQuery({ limit: 0, offset: 0, ...query });
    }      
      
  }
  
  