import {
    CoreIndexElt,
    FormCreator,
    IndexType, ProjectParams,
} from "@codeffekt/ce-core-data";
import { OldProject } from "../core";

export const PROJECT_TYPE_APP_CONFIG = "app.config";

export class ProjectBuilderAppConfig {
    constructor() {
    }

    async create(projectInput: OldProject): Promise<OldProject> {
        return {
            forms: this.createForms(projectInput.id),
            params: this.createParams() as ProjectParams,
            assets: `assets-${projectInput.id}`,
            ...projectInput,
            type: PROJECT_TYPE_APP_CONFIG,
        };
    }

    private createForms(pid: IndexType): FormCreator[] {
        return [
            {
                id: "queries-pages",
                ref: `queries-pages-${pid}`,
                root: "forms-query-page"
            },
            {
                id: "pages",
                ref: `pages-${pid}`,
                root: "forms-project-page"
            },
            {
                id: "masks",
                ref: `masks-${pid}`,
                root: "forms-mask"
            },
            {
                id: "styles",
                ref: `styles-${pid}`,
                root: "forms-style"
            }
        ];
    }

    private createParams(): Omit<ProjectParams, keyof CoreIndexElt> {
        return {
        };
    }
}