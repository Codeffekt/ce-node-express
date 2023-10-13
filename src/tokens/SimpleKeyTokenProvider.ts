import { TokenPayload } from "../core/Auth";
import { retrieveToken, TokenProvider, TokenProviderCreator } from "./TokenProvider";
import { sign, verify } from "jsonwebtoken";
import * as jwt from "express-jwt";

interface SimpleKeyConfig {
    secret: string;
    sub: string;
    aud: string;
}

export class SimpleKeyTokenProviderCreator implements TokenProviderCreator {

    fromEnv(env: any): TokenProvider {

        if (!env.JWT_SECRET) {
            throw new Error(`Missing JWT_SECRET variable for tokens mgts`);
        }

        return new SimpleKeyTokenProvider({
            secret: env.JWT_SECRET,
            sub: env.JWT_SUB,
            aud: env.JWT_AUD
        });
    }

}

export class SimpleKeyTokenProvider implements TokenProvider {

    private handler: Function;

    constructor(private config: SimpleKeyConfig) {

        this.handler = jwt({
            algorithms: ["HS256"],
            secret: (_: any, __: any, done: any) => done(null, this.config.secret),
            getToken: retrieveToken
        });

    }

    async verify(token: string): Promise<TokenPayload> {
        return verify(token, this.config.secret) as TokenPayload;
    }

    async sign(payload: TokenPayload): Promise<string> {
        return sign(payload, this.config.secret, { algorithm: 'HS256' });
    }

    getMiddleWare(): Function {
        return this.handler;
    }   
}