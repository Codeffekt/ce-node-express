import { AssetElt, IndexType } from "@codeffekt/ce-core-data";
import { Inject } from "../core/CeService";
import { AssetsService } from "../services/AssetsService";
import { ContextService } from "../services/ContextService";
import { FormsService } from "../services/FormsService";
import { AssetsArrayRef } from "./AssetsArrayRef";

export class BucketCreator {

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    @Inject(FormsService)
    private readonly formsService: FormsService;

    @Inject(ContextService)
    private readonly context: ContextService;
    
    private ref: AssetsArrayRef;

    private constructor(private formId: IndexType, private field: IndexType, private elt: AssetElt) {

    }

    public async create() {
        this.ref = await AssetsArrayRef.fromAssetsArray(this.formId, this.field);
        const bucket = await this.createBucket();
        return bucket;
    }

    static fromAssetsArray(formId: IndexType, field: IndexType, elt: AssetElt) {
        const builder = new BucketCreator(formId, field, elt);
        return builder.create();
    }    

    private async createBucket() {
        const core = this.context.createCore();
        const asset: AssetElt = {
            metadata: { timestamp: Date.now() as any },
            ...this.elt,
            ...core,
            ref: this.ref.ref,
            id: this.elt.id || core.id
        };

        return this.assetsService.insertAsset(this.ref.ref, asset);
    }
}