
import app from "./app";

const PORT = Number(process.env.PORT) || 8000

async function main() {

  const server = app.listen(PORT, () => {
    console.log(`Taper server running on port ${PORT}`)
  });

  const shutdown = async () => {
    server.close()
    process.exit(0);
  };

  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
  process.once("SIGUSR2", async () => {
    server.close();
    process.kill(process.pid, "SIGUSR2");
  });
}

main().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
})