try {
  process.loadEnvFile();
} catch {
  // .env not present locally; rely on already-exported environment variables
}
