import { ProcessingApplication } from "../../src/servers/ProcessingApplication";
import { CeService } from "../../src/core/CeService"
import { FormsApiServer } from "../../src/servers/FormsApiServer";
import { ExpressApplication } from "../../src/services/ExpressApplication";
import { Task } from "../../src/processing/Task";

async function bootstrap() {

    await CeService.get(ExpressApplication).runAppFromEnv("Processing test", {
        routers: [
            CeService.get(FormsApiServer),
        ]
    });

    CeService.get(ProcessingApplication).runAppFromEnv({
        task: new Task("../../tests/processing/task.ts"),
        server: "http://localhost:3000",
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJjZS1mb3Jtcy1hcGkiLCJzdWIiOiJjb250YWN0QGNvZGVmZmVrdC5jb20iLCJ1aWQiOiJlNjZlNzViYS1jY2VlLTQxYWYtYTdmNC05NGVjYTIwNTgyMWEiLCJleHAiOjg1NTU1NDU2MzcsImlhdCI6MTcxMjIzMzYzN30.QOWwCy8LbQOduAN8IC-EGoBjY7oLpTcozy715oJHRHY"
    });    
}

bootstrap();



