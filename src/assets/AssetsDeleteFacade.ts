import { existsSync, lstatSync, unlinkSync } from "fs";
import { AccountSettings, IndexType, InvalidParamError, UnauthorizedError } from "@codeffekt/ce-core-data";
import { StoragePathService } from "../services/StoragePathService";
import { AssetsService } from "../services/AssetsService";
import { Inject } from "../core/CeService";
import { AuthService } from "../services/AuthService";

const MAX_DELETE_SIZE = 50;

export class AssetsDeleteFacade {

    @Inject(StoragePathService)
    private readonly storageService: StoragePathService;

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;       

    @Inject(AuthService)
    private readonly authService: AuthService;

    constructor(private account: AccountSettings, private ref?: IndexType) {
    }

    async execute(ids: IndexType[], deleteFiles = true) {        

        await this.createRef();                

        if (ids.length > MAX_DELETE_SIZE) {
            throw new InvalidParamError(`Too many assets to delete (${ids.length} > ${MAX_DELETE_SIZE})`, {});
        }

        await this.assetsService.deleteAssets(this.ref, ids);

        if (deleteFiles) {
            this.deleteFiles(ids);
        }

        return true;
    }

    private async createRef() {        
        if (!this.ref && !this.authService.haveAssetsFullAccess(this.account)) {
            throw new UnauthorizedError('Invalid delete operation for unauthorized user', {});
        }
    }

    private deleteFiles(ids: IndexType[]) {
        for (const id of ids) {
            const filePath = this.storageService.getStoragePath(id, this.account, false);
            console.log(filePath);
            if (existsSync(filePath) && lstatSync(filePath).isFile()) {
                unlinkSync(filePath);
            }
        }
    }
}