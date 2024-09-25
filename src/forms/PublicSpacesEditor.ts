import { IndexType, SpacesEditorFormat } from "@codeffekt/ce-core-data";
import { CeApiCall, CeApiComponent } from "../express-router/ApiModule";
import { SpacesEditorFormatBuilder } from "../spaces-editor/SpacesEditorFormatBuilder";

@CeApiComponent()
export class PublicSpacesEditor {

    @CeApiCall
    getRoot(id: IndexType): Promise<SpacesEditorFormat> {
    return SpacesEditorFormatBuilder.fromProject(id);
  }
}