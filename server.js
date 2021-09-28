import app from "./app.js";
import { config } from "dotenv";
import consola from "consola";

process.on("uncaughtException", (err) => {
  consola.error("UNCAUGHT EXCEPTION! Shutting down...");
  consola.info(err.name, err.message);
  process.exit(1);
});

config({ path: "./config.env" });

/** PORT */
const port = process.env.NODE_ENV === "production" ? process.env.PORT : 8080;
app.set("port", port);


const server = app.listen(port, () => {
  consola.info(`App running on port ${port}...`);
});

/** HANDLE UNHANDLED REJECTION */
process.on("unhandledRejection", err => {
  consola.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  consola.error("SIGTERM RECEIVED. Shutting down gracefully");
  server.close(() => {
    consola.info("PROCESS TERMINATED!");
  });
});
