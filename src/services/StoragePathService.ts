import { AccountSettings, AssetElt, IndexType } from "@codeffekt/ce-core-data";
import { Inject, Service } from "../core/CeService";
import { ContextService } from "./ContextService";

const mkdirp = require("mkdirp");

// dir path depth <x>/<y>/.../<STORAGE_DEPTH/
// filename length must be greater than this
// otherwise returned path is the base path
const STORAGE_DEPTH = 2;
// used to avoid check if the dir is already created on disk
// we fix a limit for this array in order to prevent large size
// const KNOWN_DIRS_PATH: string[] = []; 

const BUCKETS: AssetElt[] = [];

@Service()
export class StoragePathService {    

    @Inject(ContextService)
    private readonly context: ContextService;

    constructor() {}

    getStoragePathRoot(bucketId: IndexType, root: string, check: boolean = true) {        
        const pathDepth = bucketId.substring(0, STORAGE_DEPTH);        

        if (pathDepth.length < STORAGE_DEPTH) {
            return root;
        }

        const path = root + pathDepth.split("").join("/");        

        if (check) {
            const res = mkdirp.sync(path);                        
        }        

        return path;
    }

    getStoragePath(bucketId: IndexType, account: AccountSettings, check: boolean = true) {         
        return this.getStoragePathRoot(
            bucketId, 
            this.context.getStoragePath() + account.key + "/", 
            check);        
    }    

    getFilename(bucketId: IndexType) {
        return bucketId;
    }



}
