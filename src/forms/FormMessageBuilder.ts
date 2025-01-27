import { FormEvent, FormRoot, IndexType } from "@codeffekt/ce-core-data";

export class FormMessageBuilder {


    static forRootUpsert(root: FormRoot, author: IndexType): FormEvent {

        return {
            type: 'update',
            elts: [root.id],
            author,
            time: root.mtime
        };

    }

}