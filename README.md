# ce-node-express

nodejs module used to create a backend api for ce-forms

## Running server examples

First you need to create an environnement file

    JWT_SECRET=<your secret>
    JWT_AUD=<your aud>
    JWT_SUB=<your sub>            
    CONTEXT_ROOT=<path used to store assets>
    PGUSER=<db user>
    PGPASSWD=<db password>
    PGDB=<db name>
    PGPORT=<db port>
    PGHOST=<db host>
    VERSION=<your version>

Then you give the file path from the command line using the ENV_SCRIPT variable

 > ENV_SCRIPT=<path to your env file> ts-node-dev ./examples/server_with_assets.ts


