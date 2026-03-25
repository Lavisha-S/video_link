/**
 * Backend API Tests
 * Run: npm test (from /server directory)
 *
 * NOTE: Tests mock Twilio so no real credentials are needed.
 */

process.env.TWILIO_ACCOUNT_SID = "ACtest1234567890abcdef1234567890ab";
process.env.TWILIO_API_KEY = "SKtest1234567890abcdef1234567890ab";
process.env.TWILIO_API_SECRET = "test_secret_value_here";
process.env.NODE_ENV = "test";

const request = require("supertest");

// Mock twilio module before requiring app
jest.mock("twilio", () => {
  const mockJwt = jest.fn().mockReturnValue("mock.jwt.token");
  mockJwt.prototype.toJwt = jest.fn().mockReturnValue("mock.jwt.token");
  mockJwt.prototype.addGrant = jest.fn();

  const MockAccessToken = jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockReturnValue("mock.jwt.token"),
  }));
  MockAccessToken.VideoGrant = jest.fn().mockImplementation(() => ({}));

  return {
    jwt: {
      AccessToken: MockAccessToken,
    },
  };
});

const app = require("./index");

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("POST /generate-token", () => {
  const validBody = { identity: "Alice", roomName: "TestRoom" };

  it("returns 200 and a token for valid input", async () => {
    const res = await request(app).post("/generate-token").send(validBody);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.identity).toBe("Alice");
    expect(res.body.roomName).toBe("TestRoom");
  });

  it("returns 400 when identity is missing", async () => {
    const res = await request(app)
      .post("/generate-token")
      .send({ roomName: "TestRoom" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/identity/i);
  });

  it("returns 400 when roomName is missing", async () => {
    const res = await request(app)
      .post("/generate-token")
      .send({ identity: "Alice" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/roomName/i);
  });

  it("returns 400 when identity is empty string", async () => {
    const res = await request(app)
      .post("/generate-token")
      .send({ identity: "   ", roomName: "TestRoom" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for identity with special characters", async () => {
    const res = await request(app)
      .post("/generate-token")
      .send({ identity: "<script>alert(1)</script>", roomName: "TestRoom" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when identity exceeds 100 chars", async () => {
    const res = await request(app)
      .post("/generate-token")
      .send({ identity: "a".repeat(101), roomName: "TestRoom" });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    const res = await request(app).post("/generate-token").send({});
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.statusCode).toBe(404);
  });
});
