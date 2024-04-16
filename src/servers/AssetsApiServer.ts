import { Response } from "express";
import { NextFunction } from "express";
import * as multer from "multer";
import { existsSync, readFile } from "fs";
import { Inject, Service } from "../core/CeService";
import { Controller, Get, Post } from "../express-router/ExpressRouter";
import { StoragePathService } from "../services/StoragePathService";
import { AssetsService } from "../services/AssetsService";
import { JwtUserRequest } from "../core/Auth";
import { EltNotFoundError } from "@codeffekt/ce-core-data";
const quickthumb = require("@codeffekt/quickthumb");

@Service()
@Controller({ path: '/assets/' })
export class AssetsApiServer {

    @Inject(StoragePathService)
    private readonly storageService: StoragePathService;

    @Inject(AssetsService)
    private readonly assetsService: AssetsService;

    private storageEngine: multer.StorageEngine;

    private storageHandler: any;

    constructor() {
        this.config();
    }

    private config() {
        this.storageEngine = multer.diskStorage({
            destination: (req: any, file, cb) => {
                const storagePath = this.storageService.getStoragePath((<any>req).params.id, req.user.data.diagAccount);
                (<any>cb)(null, storagePath);
            },
            filename: (req, file, cb) => {              
                const filename = this.storageService.getFilename((<any>req).params.id);
                (<any>cb)(null, filename);
            }
        });

        this.storageHandler = multer({ storage: this.storageEngine }).single("file");
    }    

    @Get({ path: '/images/:id' })
    async getImageThumb(req: JwtUserRequest, res: Response, next: NextFunction) {        
        try {               
            const bucketId = req.params.id;
            const fileDir = `${this.storageService.getStoragePath(bucketId, req.user.data.diagAccount, false)}/`;                           
            res.contentType("image/jpg");                        
            req.url = bucketId; // we force the url replacement because quickthumb parse this property to retrieve the image name
            if(!existsSync(`${fileDir}/${bucketId}`)) {
                throw new EltNotFoundError(`Image ${req.params.id} not found`, req.params);
            }
            return quickthumb.static(fileDir)(req, res, next);            
        } catch (err) {
            next(err);
        }
    }

    @Post({ path: '/upload/:id' })
    runMulter(req: JwtUserRequest, res: Response, next: NextFunction) {        
        return this.storageHandler(req, res, next);
    }

    @Post({ path: '/upload/:id' })
    async upload(req: JwtUserRequest, res: Response, next: NextFunction) {
        try {
            const asset = await this.assetsService.getAsset(req.params.id);
            const newAsset = {
                ...asset, ...{
                    name: this.storageService.getFilename(asset.id),
                    mimetype: req.file.mimetype,
                    originalname: req.file.originalname,
                    size: req.file.size,
                    key: req.user.data.diagAccount.key,
                    author: req.user.data.diagAccount.id
                }
            };
            const updatedAsset = await this.assetsService.updateAsset(newAsset);
            res.json(updatedAsset);
        } catch (err) {
            next(err);
        }
    }

    @Get({ path: '/download/:id' })
    async download(req: JwtUserRequest, res: Response, next: NextFunction) {
        try {
            const asset = await this.assetsService.getAsset(req.params.id);
            const diagAccount = asset.key ? {...req.user.data.diagAccount, key: asset.key } : req.user.data.diagAccount;
            const resAsset = {
                ...asset, ...{
                    path: this.storageService.getStoragePath(req.params.id, diagAccount, false),
                    mimetype: req.query.mimetype ? req.query.mimetype : asset.mimetype
                }
            };
            readFile(resAsset.path + "/" + resAsset.name, function (err: any, data: any) {

                if (err) {
                    next(err);
                }

                res.contentType(resAsset.mimetype as string);
                res.send(data);
            });
        } catch (err) {
            next(err);
        }
    }


}