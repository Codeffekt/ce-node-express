import { existsSync, lstatSync, unlinkSync } from "fs";
import { AccountSettings, IndexType, InvalidParamError, UnauthorizedError } from "@codeffekt/ce-core-data";
import { StoragePathService } from "../services/StoragePathService";
import { AssetsService } from "../services/AssetsService";
import { Inject } from "../core/CeService";
import { AuthService } from "../services/AuthService";
import { AssetsArrayRef } from "./AssetsArrayRef";

const MAX_DELETE_SIZE = 50;

export class AssetsDeleteFacade {

    @Inject(StoragePathService)
    private readonly storageService: StoragePathService;

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    @Inject(AuthService)
    private readonly authService: AuthService;

    private constructor(
        private account: AccountSettings,
        private ids: IndexType[],
        private ref?: IndexType,
        private deleteFiles = true) {
    }

    private async execute() {

        await this.createRef();

        if (this.ids.length > MAX_DELETE_SIZE) {
            throw new InvalidParamError(`Too many assets to delete (${this.ids.length} > ${MAX_DELETE_SIZE})`, {});
        }

        await this.assetsService.deleteAssets(this.ref, this.ids);

        if (this.deleteFiles) {
            this.executeDeleteFiles();
        }

        return true;
    }

    static fromRef(account: AccountSettings, ids: IndexType[], ref?: IndexType, deleteFiles = true) {
        const deleteFacade = new AssetsDeleteFacade(
            account, ids, ref, deleteFiles);
        return deleteFacade.execute();
    }

    static async fromAssetsArray(
        account: AccountSettings,
        ids: IndexType[],
        formId: IndexType,
        field: IndexType,
        deleteFiles = true
    ) {
        const ref = await AssetsArrayRef.fromAssetsArray(formId, field);
        const deleteFacade = new AssetsDeleteFacade(
            account, ids, ref.ref, deleteFiles);
        return deleteFacade.execute();
    }

    private async createRef() {
        if (!this.ref && !this.authService.haveAssetsFullAccess(this.account)) {
            throw new UnauthorizedError('Invalid delete operation for unauthorized user', {});
        }
    }

    private executeDeleteFiles() {
        for (const id of this.ids) {
            const filePath = this.storageService.getStoragePath(id, this.account, false);
            console.log(filePath);
            if (existsSync(filePath) && lstatSync(filePath).isFile()) {
                unlinkSync(filePath);
            }
        }
    }
}