import request from "supertest";
import jwt from "jsonwebtoken";

const testSecret = "test-secret";
let app: any;

beforeAll(() => {
  // Ensure server boot doesn't fail (loadEnv throws if JWT_SECRET is missing).
  process.env.JWT_SECRET = process.env.JWT_SECRET || testSecret;
});

beforeAll(() => {
  // Mock DB so routes never touch a real database during auth/role tests.
  jest.resetModules();
  jest.doMock("../db/knexClient", () => {
    return {
      knexInstance: null,
      dbClient: "pg"
    };
  });
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  app = require("../app").default;
});

function makeToken(role: "WAITER" | "CHEF" | "MANAGER") {
  const payload = { sub: "00000000-0000-4000-8000-000000000001", role, name: "Test User" };
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "1h" });
}

describe("Security guards", () => {
  test("tables GET requires auth", async () => {
    const res = await request(app).get("/api/v1/tables");
    expect(res.status).toBe(401);
  });

  test("tables POST enforces MANAGER role", async () => {
    const token = makeToken("WAITER");
    const res = await request(app)
      .post("/api/v1/tables")
      .set("Authorization", `Bearer ${token}`)
      .send({ number: 1, seating_capacity: 4 });
    expect(res.status).toBe(403);
  });

  test("kitchen-alerts POST enforces CHEF or MANAGER role", async () => {
    const token = makeToken("WAITER");
    const res = await request(app)
      .post("/api/v1/kitchen-alerts")
      .set("Authorization", `Bearer ${token}`)
      .send({ order_id: "00000000-0000-4000-8000-000000000002", type: "OTHER", message: "x" });
    expect(res.status).toBe(403);
  });
});

