import express from 'express';
import { createServer, Server } from 'http';
import { initialize } from "koalanlp/Util";
import database from "./config/database";
import controller from "./controller";

(async () => {
    database.sync();

    await initialize({
        packages: { MKR: "2.0.4", MMKA: "2.0.4" },
        verbose: true,
    });

    const app = express();

    app.use(controller);

    const server = createServer(app);
    server.listen(process.env.PORT || 5050);
})();