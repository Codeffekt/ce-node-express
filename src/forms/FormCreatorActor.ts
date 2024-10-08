import {
    FormInstance, 
    FormPreFilledProps, 
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

    static fromPreFilledProps(props: FormPreFilledProps[]): FormCreateActor[] {
        return props.map((elt) => (form: FormInstance) => {
            if (form.root === elt.root) {
                FormWrapper.setFormValues(elt.props, form);
            }
        });
    }
}