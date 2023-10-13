import { hash as bcrypt_hash, compare as bcrypt_compare } from "bcrypt";
import { AccountSettings, ACCOUNT_SUPERADMIN, ROLE_ADMIN, UnauthorizedError } from "@codeffekt/ce-core-data";
import { JwtUser, JwtUserData, LoginRequest, SessionContext, TokenPayload } from "../core/Auth";
import { AccountsService } from "./AccountsService";
import { Inject, Service } from "../core/CeService";
import { TokenProvider } from "../tokens/TokenProvider";
import { SimpleKeyTokenProvider } from "../tokens/SimpleKeyTokenProvider";
import { TokenProviderFactory } from "../tokens/TokenProviderFactory";

const ROUNDS = 10;

const jwt_expiration = 60 * 60; // 1 hour;
const jwt_refresh_expiration = 60 * 60 * 24 * 15; // 2 weeks

export interface AuthServiceConfig {
    env: any;
    secret: string;
    sub: string;
    aud: string;
    tokenProvider: string;
    uidFieldName?: string;
    jwtExpiration?: number;
    jwtRefreshExpiration?: number;
    assetsFullAccess?: boolean;
}

export interface AuthTokenData {
    token: string;
    payload: {
        exp: number;
        uid: string;
        aud: string | string[];
        sub: string;
    }
}

@Service()
export class AuthService {

    private config: AuthServiceConfig = {
        env: {},
        secret: '123456789',
        sub: 'dev',
        aud: 'dev',
        tokenProvider: 'default',
        jwtExpiration: jwt_expiration,
        jwtRefreshExpiration: jwt_refresh_expiration,
    }

    private tokenProvider: TokenProvider = new SimpleKeyTokenProvider(this.config);

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor() { }

    static async createHash(passwd: string) {
        return bcrypt_hash(passwd, ROUNDS);
    }

    static isAdmin(account: AccountSettings): boolean {
        return account && account.role === ROLE_ADMIN;
    }

    static isSuperAdmin(account: AccountSettings): boolean {
        return account && account.account === ACCOUNT_SUPERADMIN && account.role === ROLE_ADMIN;
    }

    static isRole(account: AccountSettings, role: string | string[]): boolean {
        return account && (account.role === ROLE_ADMIN
            || (Array.isArray(role) ? role.indexOf(account.role) !== -1 : account.role === role));
    }

    static isAuthZ(account: AccountSettings, resource: string, action: string): boolean {
        return account && account.authz &&
            account.authz[resource] && account.authz[resource].actions &&
            Array.isArray(account.authz[resource].actions) && account.authz[resource].actions.includes(action);
    }

    static filterAccountSettings(account: AccountSettings, forOtherMembers: boolean = false) {
        if (forOtherMembers) {
            return {
                id: account.id,
                ctime: account.ctime,
                login: account.login,
                firstName: account.firstName,
                lastName: account.lastName,
                email: account.email,
                account: account.account,
                lang: account.lang,
                role: account.role
            } as AccountSettings;
        } else {
            return Object.assign({}, account, { key: undefined, passwd: undefined });
        }
    }

    setConfig(config: AuthServiceConfig) {
        this.config = { ...this.config, ...config };        
        this.tokenProvider = TokenProviderFactory.fromEnv(this.config.tokenProvider, this.config.env);
    }

    getConfig() {
        return this.config;
    }

    getTokenProvider() {
        return this.tokenProvider;
    }

    getUserData(user: JwtUser): Partial<JwtUserData> {
        return this.config.uidFieldName ? { login: user[this.config.uidFieldName] } : user.data;
    }

    async authLogin(request: LoginRequest): Promise<SessionContext> {

        if (!request.login || !request.password) {
            throw new UnauthorizedError("Error access not authorized", {});
        }

        const account = await this.accountsService.getAccountFromLogin(request.login);

        if (!account) {
            throw new UnauthorizedError(`Invalid login/password`, {});
        }

        const passwdCompare = await this.compare(request.password, account.passwd);

        if (!passwdCompare) {
            throw new UnauthorizedError(`Invalid login/password`, {});
        }

        return this.generateSession(account);
    }

    async verifyToken(token: string): Promise<TokenPayload> {        
        const tokenContext = await this.tokenProvider.verify(token);
        const account = await this.accountsService.getAccountFromId(tokenContext.uid);

        if (!account) {
            throw new UnauthorizedError(`Invalid uid in token`, {});
        }

        return tokenContext;
    }

    async renewSession(tokenPayload: TokenPayload): Promise<SessionContext> {
        const account = await this.accountsService.getAccountFromId(tokenPayload.uid);
        return this.generateSession(account);
    }

    async createToken(config: TokenPayload, expiration?: number): Promise<AuthTokenData> {
        const payload = {
            ...config,
            ...expiration ? { exp: Math.floor(Date.now() / 1000) + expiration } : undefined,

        };
        const token = await this.tokenProvider.sign(payload);
        return { token, payload };
    }

    haveAssetsFullAccess(account: AccountSettings): boolean {
        return this.config.assetsFullAccess || AuthService.isSuperAdmin(account);
    }

    private compare(passwd: string, hash: string): Promise<boolean> {
        return bcrypt_compare(passwd, hash);
    }

    private async generateSession(account: AccountSettings): Promise<SessionContext> {
        const session = await this.generateToken(account, this.config.jwtExpiration);
        session.refreshToken = (await this.generateToken(account, this.config.jwtRefreshExpiration)).token;
        return session;
    }

    private async generateToken(
        account: AccountSettings,
        expiration = jwt_expiration): Promise<SessionContext> {

        const tokenData = await this.createToken({
            uid: account.id,
            sub: this.config.sub,
            aud: this.config.aud
        }, expiration);

        return {
            exp: tokenData.payload.exp,
            data: { ...account, ...tokenData.payload },
            token: tokenData.token,
        };
    }
}