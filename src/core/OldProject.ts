import { CoreIndexElt, FormCreator, IndexType, ProjectParams, ProjectStatus, ProjectType } from "@codeffekt/ce-core-data";

export interface OldProject extends CoreIndexElt {
    type: ProjectType;
    name: string;
    status: ProjectStatus;
    account: IndexType;
    assets: IndexType;
    tunnelOrigin?: IndexType;
    forms: FormCreator[];
    params?: ProjectParams;
}