import { Request, Response, NextFunction } from "express";
import { Controller, Get, Post, Use } from "../express-router/ExpressRouter";
import { UnauthorizedError } from "@codeffekt/ce-core-data";
import { AccountsService } from "../services/AccountsService";
import { JwtUser, JwtUserRequest, SessionContext } from "../core/Auth";
import { AuthService } from "../services/AuthService";
import { Inject, Service } from "../core/CeService";

const COOKIE_LABEL = "access_token";
const REFRESH_COOKIE_LABEL = "refresh_token";

const NO_AUTH_ROUTES = [
    '/login', 
    '/api/login', 
    '/api/authenticate',
    '/persistent',
    '/api/persistent', 
    '/logout', 
    "/api/logout",
    "/auth/report"
];

@Service()
@Controller({ path: '/' })
export class AuthServer {    

    @Inject(AuthService)
    private readonly authService: AuthService;

    @Inject(AccountsService)
    private readonly accountsService: AccountsService;

    constructor(
    ) {
        this.config();
    }

    private config() {        
    }

    @Use({
        unless: {
            path: NO_AUTH_ROUTES
        }
    })
    useJwt(req: any, res: any, next: any) {
        return this.authService.getTokenProvider().getMiddleWare()(req, res, next);
    }

    @Use({
        unless: {
            path: NO_AUTH_ROUTES
        }
    })
    async initContext(req: JwtUserRequest, res: Response, next: NextFunction) {        

        if (!req.user) {
            throw new UnauthorizedError("Undef/Invalid token payload", {});
        }

        req.user.data = { ...req.user.data, ...this.authService.getUserData(req.user) };    

        if((!req.user.uid && !req.user.data)) {
            throw new UnauthorizedError("Missing user login data", {});
        }

        try {
            const account = req.user.uid ?
                await this.retrieveUserFromToken(req.user) :
                await this.retrieveUidFromOldTokenVersion(req.user);
            req.user.data = {
                login: account.login,
                account: account.account,
                diagAccount: account
            };
            next();
        } catch (err) {
            next(err);
        }
    }

    @Get({ path: '/self' })
    self(req: JwtUserRequest, res: Response) {
        res.json(req.user);
    }

    @Get({ path: ['/persistent', '/api/persistent'] })
    async persistent(req: JwtUserRequest, res: Response, next: NextFunction) {
        try {
            if (!req.cookies || !req.cookies.refresh_token) {
                throw new UnauthorizedError("Auth failed refresh token missing", {});
            }

            const tokenPayload = await this.authService.verifyToken(req.cookies.refresh_token);

            const session = await this.authService.renewSession(tokenPayload);

            this.setSessionCookies(session, res);
            res.json(session);
        } catch (err) {
            next(err);
        }
    }

    @Post({ path: ['/login', '/api/login', '/api/authenticate'] })
    async login(req: Request, res: Response, next: NextFunction) {
        const payload = {
            login: req.body?.login,
            password: req.body?.password || req.body?.passwd
        };

        try {

            if (!payload || !payload.login || !payload.password) {
                throw new UnauthorizedError('missing login/password', {});
            }

            const session = await this.authService.authLogin(payload);

            this.setSessionCookies(session, res);

            res.json(session);

        } catch (err) {
            next(err);
        }
    }

    @Get({ path: ['/logout', '/api/logout'] })
    logout(req: Request, res: Response, next: NextFunction) {
        this.clearSessionCookies(res);
        res.json({ logout: true });
    }    

    private clearSessionCookies(res: Response) {
        res.cookie(COOKIE_LABEL, '', {
            maxAge: -1,
            httpOnly: true
        });

        res.cookie(REFRESH_COOKIE_LABEL, '', {
            maxAge: -1,
            httpOnly: true
        });
    }

    private setSessionCookies(session: SessionContext, res: Response) {
        res.cookie(COOKIE_LABEL, session.token, {
            // secure: true,
            httpOnly: true
        });

        res.cookie(REFRESH_COOKIE_LABEL, session.refreshToken, {
            httpOnly: true
        });
    }

    private async retrieveUserFromToken(user: JwtUser) {
        const account = await this.accountsService.getAccountFromId(user.uid);
        if (!account) {
            throw new UnauthorizedError(`Unknow account id ${user.uid}`, { uid: user.uid });
        }
        return account;
    }

    private async retrieveUidFromOldTokenVersion(user: JwtUser) {
        const account = await this.accountsService.getAccountFromLogin(user.data.login);
        if (!account) {
            throw new UnauthorizedError(`Unknow account login ${user.data.login}`, { login: user.data.login });
        }
        user.uid = account.id;
        const authConfig = this.authService.getConfig();
        user.aud = authConfig.aud;
        user.sub = authConfig.sub;
        return account;
    }
}