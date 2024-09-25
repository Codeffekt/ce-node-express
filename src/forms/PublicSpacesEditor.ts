import { IndexType, SpacesEditorFormat } from "@codeffekt/ce-core-data";
import { CeApiAccountId, CeApiBinds, CeApiCall, CeApiComponent } from "../express-router/ApiModule";
import { SpacesEditorFormatBuilder } from "../spaces-editor/SpacesEditorFormatBuilder";
import { SpacesEditorFormatUpdater } from "../spaces-editor/SpacesEditorFormatUpdater";

@CeApiComponent()
export class PublicSpacesEditor {

  @CeApiCall
  getEditorFormat(id: IndexType): Promise<SpacesEditorFormat> {
    return SpacesEditorFormatBuilder.fromProject(id);
  }

  @CeApiCall
  @CeApiBinds
  updateEditorFormat(@CeApiAccountId id: IndexType, pid: IndexType, format: SpacesEditorFormat): Promise<boolean> {
    return SpacesEditorFormatUpdater.update(pid, format, id);
  }
}
  