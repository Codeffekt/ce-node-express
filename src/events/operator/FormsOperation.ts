import { DbArrayRes, FormInstance } from "@codeffekt/ce-core-data";

export interface FormsOperation {

    operate(res: DbArrayRes<FormInstance>): Promise<void>;

}