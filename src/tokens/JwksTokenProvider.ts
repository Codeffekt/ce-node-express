import { TokenPayload } from "../core";
import { Request } from "express";
import { retrieveToken, TokenProvider, TokenProviderCreator } from "./TokenProvider";
import { verify } from "jsonwebtoken";
import * as jwt from "express-jwt";

const jwksClient = require('jwks-rsa');

interface JwksConfig {
    uri: string;
    kid?: string;
}

export class JwksTokenProviderCreator implements TokenProviderCreator {

    fromEnv(env: any): TokenProvider {

        if (!env.JWKS_URI) {
            throw new Error(`Missing JWKS_URI variable for token mgt.`);
        }

        return new JwksTokenProvider({
            uri: env.JWKS_URI,
            kid: env.JWKS_KID
        });
    }

}

export class JwksTokenProvider implements TokenProvider {

    private client: any;
    private handler: Function;

    constructor(private config: JwksConfig) {
        this.client = jwksClient({
            jwksUri: this.config.uri
        });

        this.handler = jwt({
            algorithms: ["RS256"],
            secret: (req: Request, header: any, callback: any) => this.getKey(header, callback),
            getToken: retrieveToken
        });
    }

    verify(token: string): Promise<TokenPayload> {
        return new Promise((resolve, reject) =>
            verify(
                token,
                this.getKey.bind(this),
                { algorithms: ['RS256'] },
                (err, decoded: TokenPayload) => err ? reject(err) :
                    resolve(decoded)
            ));
    }

    sign(payload: TokenPayload): Promise<string> {
        throw new Error("This provider cannot be used to sign token.");
    }

    getMiddleWare() {
        return this.handler;
    }

    private getKey(header: any, callback: any) {        
        this.client.getSigningKey(header.kid || this.config.kid, (err, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }       
}