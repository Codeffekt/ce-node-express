import {
    FormInstance, 
    FormWrapper, IndexType
} from "@codeffekt/ce-core-data";

export type FormCreateActor = (newForm: FormInstance) => void;

export class FormCreatorBuilder {

    static fromPartialContent(root: IndexType, props: any): FormCreateActor {        
        return (form: FormInstance) => {
            if (form.root === root) {
                FormWrapper.setFormValues(props, form);
            }
        }
    }

}