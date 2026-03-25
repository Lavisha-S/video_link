const twilio = require("twilio");

const AccessToken = twilio.jwt.AccessToken;
const VideoGrant = AccessToken.VideoGrant;

/**
 * Generates a Twilio Video Access Token.
 * @param {string} identity - Unique participant identity
 * @param {string} roomName - Name of the video room
 * @returns {string} JWT access token
 */
function generateToken(identity, roomName) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;

  // These should already be validated by validateEnv, but double-check
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error("Missing Twilio credentials in environment variables.");
  }

  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity,
    ttl: 3600, // Token valid for 1 hour
  });

  const videoGrant = new VideoGrant({ room: roomName });
  token.addGrant(videoGrant);

  return token.toJwt();
}

module.exports = { generateToken };
