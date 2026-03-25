const { logger } = require("./logger");

const REQUIRED_ENV_VARS = [
  "TWILIO_ACCOUNT_SID",
  "TWILIO_API_KEY",
  "TWILIO_API_SECRET",
];

/**
 * Validates that all required environment variables are present.
 * Exits the process if any are missing.
 */
function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    logger.error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
    logger.error(
      "Please check your .env file. See .env.example for reference."
    );
    process.exit(1);
  }

  // Validate Account SID format (starts with AC)
  if (!process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
    logger.error(
      "TWILIO_ACCOUNT_SID appears invalid. It should start with 'AC'."
    );
    process.exit(1);
  }

  logger.info("Environment variables validated successfully.");
}

module.exports = { validateEnv };
