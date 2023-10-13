import {
    FormProjectWrapper, FormProject,
    FormInstance, AccountSettings,
    FormCreator, FormBlock,
    FORM_PROJECT_ASSETS_FIELD
} from "@codeffekt/ce-core-data";
import { OldProject } from "../core/OldProject";
import { FormBlockBuilder } from "../forms/FormBlockBuilder";

export class FormProjectBuilder {

    static fromProject(project: OldProject, user: AccountSettings): FormProjectWrapper {

        const formInstance: FormInstance = {
            author: user.id,
            root: FormProject.ROOT,
            title: project.name ?? "Project {name}",
            valid: true,
            id: project.id,
            ctime: project.ctime,
            mtime: project.mtime,
            content: {
                name: this.createFormBlockText(project, "name", "Name"),
                type: this.createFormBlockText(project, "type", "Type"),
                status: this.createFormBlockText(project, "status", "Status"),
                account: this.createFormBlockText(project, "account", "Account"),
                params: {
                    type: "object",
                    field: "params",
                    label: "Params",
                    value: project.params
                },
            }
        };

        const assocs = project.forms;

        if (assocs?.length) {
            for (const assoc of assocs) {
                formInstance.content[assoc.id] = this.createFormBlockArrayFromAssoc(assoc);
            }
        }

        formInstance.content = {
            ...formInstance.content,
            ...this.createAssetsPart(project)
        };

        return new FormProjectWrapper(formInstance);
    }

    private static createFormBlockArrayFromAssoc(assoc: FormCreator): FormBlock {
        return FormBlockBuilder.asFormArrayFromAssoc(assoc);
    }

    private static createFormBlockText(project: OldProject, field: keyof OldProject, label: string): FormBlock {
        return FormBlockBuilder.asTextFromObj(project, field, label);
    }

    private static createAssetsPart(project: OldProject): { [field: string]: FormBlock } {
        return {
            [FORM_PROJECT_ASSETS_FIELD]: {
                field: FORM_PROJECT_ASSETS_FIELD,
                label: "Media",
                type: "assetArray",
                value: project.assets ?? project.id
            }
        };
    }
}