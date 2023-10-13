import { JwksTokenProviderCreator } from "./JwksTokenProvider";
import { SimpleKeyTokenProviderCreator } from "./SimpleKeyTokenProvider";
import { TokenProvider, TokenProviderCreator } from "./TokenProvider";

const TOKEN_FACTORY: { [type: string]: TokenProviderCreator } = {
    "default": new SimpleKeyTokenProviderCreator(),
    "jwks": new JwksTokenProviderCreator()
}

export class TokenProviderFactory {

    static fromEnv(type: string, env: any): TokenProvider {
        const creator = TOKEN_FACTORY[type];

        if (!creator) {
            throw new Error(`Unknown token provider type ${type}`);
        }        

        return creator.fromEnv(env);
    }

}