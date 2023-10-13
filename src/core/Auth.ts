import { Request } from "express";
import { AccountSettings, IndexType } from "@codeffekt/ce-core-data";

export interface JwtUserData {
    login: IndexType;
    account: IndexType;
    diagAccount: AccountSettings;
}

export interface TokenPayload {
    uid: string;
    aud: string|string[];
    sub: string;
}
export interface JwtUser extends TokenPayload {
    login: IndexType;
    role: string;
    account: IndexType;
    data: JwtUserData
}
export interface JwtUserRequest extends Request {
    user: JwtUser;
}

export interface LoginRequest {
    login: string;
    password: string;
}

export interface SessionContext {
    exp: number;
    data: any;
    token?: string;
    refreshToken?: string;
    account?: AccountSettings;
}