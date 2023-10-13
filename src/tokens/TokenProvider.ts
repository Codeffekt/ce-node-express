import { TokenPayload } from "../core/Auth";
import { Request } from "express";

export interface TokenProvider {    
    verify(token: string): Promise<TokenPayload>;
    sign(payload: TokenPayload): Promise<string>;
    getMiddleWare(): Function;
}

export interface TokenProviderCreator {
    fromEnv(env: any): TokenProvider;
}

export function retrieveToken(req: Request): string {
    if (req.headers.authorization && (<string>req.headers.authorization).split(" ")[0] === "Bearer") {
        return (<string>req.headers.authorization).split(" ")[1];
    } else if (req.query && req.query.token) {
        return req.query.token as string;
    } else if (req.cookies) {
        return req.cookies.access_token;
    }
    return undefined;
}
