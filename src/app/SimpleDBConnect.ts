import { CeService } from "../core/CeService";
import { DatabaseServer } from "../servers/DatabaseServer";
import { GisDatabase } from "../servers/GisDatabase";

export class SimpleDBConnectImpl {

    async connectAdminToAdminDB() {

        await CeService.get(DatabaseServer).setConfig({
            host: process.env.PGHOST,
            user: process.env.PG_ADMIN_USER || "postgres",
            password: process.env.PG_ADMIN_PASSWD || "postgres",
            database: process.env.PG_ADMIN_DB || "postgres",
            port: parseInt(process.env.PGPORT)
        });

    }

    async connectAdminToFormsDB() {

        await CeService.get(DatabaseServer).setConfig({
            host: process.env.PGHOST,
            user: process.env.PG_ADMIN_USER || "postgres",
            password: process.env.PG_ADMIN_PASSWD || "postgres",
            database: process.env.PGDB,
            port: parseInt(process.env.PGPORT)
        });

    }

    async connectDefaultUserToFormsDB() {

        await CeService.get(DatabaseServer).setConfig({
            host: process.env.PGHOST,
            user: process.env.PGUSER,
            password: process.env.PGPASSWD,
            database: process.env.PGDB,
            port: parseInt(process.env.PGPORT)
        });

    }

    async connectDefaultUserToGisDB() {

        if(!process.env.PGHOST_GIS) {
            return;
        }

        await CeService.get(GisDatabase).setConfig({
            host: process.env.PGHOST_GIS,
            user: process.env.PGUSER_GIS,
            password: process.env.PGPASSWD_GIS,
            database: process.env.PGDB_GIS,
            port: parseInt(process.env.PGPORT_GIS)
        });  

    }

    async close() {
        await CeService.get(DatabaseServer).close();

        if(process.env.PGHOST_GIS) {
            await CeService.get(GisDatabase).close();
        }
    }
}

export const SimpleDBConnect = new SimpleDBConnectImpl();