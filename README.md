# ce-node-express

nodejs module used to create a backend api for ce-forms

## Running server examples

First you need to create an environnement file

    JWT_SECRET=<your secret>
    JWT_AUD=<your aud>
    JWT_SUB=<your sub>  
    JWT_EXPIRATION=<expiration duration seconds>
    JWT_REFRESH_EXPIRATION=<expiration duration seconds>          
    CONTEXT_ROOT=<path used to store assets>
    PGUSER=<db user>
    PGPASSWD=<db password>
    PGDB=<db name>
    PGPORT=<db port>
    PGHOST=<db host>
    VERSION=<your version>
    PG_ADMIN_USER=<db superadmin user>
    PG_ADMIN_PASSWD=<db superadmin passwd>
    PG_ADMIN_DB=<db superadmin db>
    CE_FORMS_LOGIN=<default login>
    CE_FORMS_ACCOUNT=<default account>
    CE_FORMS_PASSWD=<default password>

Then you give the file path from the command line using the ENV_SCRIPT variable

 > ENV_SCRIPT=<path to your env file> ts-node-dev ./examples/server_with_assets.ts


