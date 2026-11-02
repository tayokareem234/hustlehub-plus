const request = require("supertest");
const app = require("../src/server");
const jwt = require("jsonwebtoken");

// ============================================
// TEST JWT HELPER
// ============================================

const createTestToken = (role) => {
    return jwt.sign(
        {
            id: "64b000000000000000000001",
            role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h",
            algorithm: "HS256"
        }
    );
};


// ============================================
// HUSTLEHUB+ BACKEND TESTS
// ============================================

describe("HustleHub+ Backend API", () => {


    // ========================================
    // TEST 1: HEALTH ENDPOINT
    // ========================================

    test("API health endpoint returns HTTP 200", async () => {

        const response = await request(app)
            .get("/api/health");

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);

        expect(response.body.message)
            .toBe("HustleHub+ API is running");

    });


    // ========================================
    // TEST 2: HELMET SECURITY HEADERS
    // ========================================

    test("API responses contain Helmet security headers", async () => {

        const response = await request(app)
            .get("/api/health");

        expect(response.headers["content-security-policy"])
            .toContain("default-src 'self'");

        expect(response.headers["x-content-type-options"])
            .toBe("nosniff");

        expect(response.headers["x-frame-options"])
            .toBe("SAMEORIGIN");

        expect(response.headers["strict-transport-security"])
            .toBeDefined();

    });


    // ========================================
    // TEST 3: UNKNOWN API ROUTE
    // ========================================

    test("Unknown API routes return HTTP 404", async () => {

        const response = await request(app)
            .get("/api/this-route-does-not-exist");

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("API endpoint not found");

    });


    // ========================================
    // TEST 4: INVALID JSON REQUEST
    // ========================================

    test("Malformed JSON requests return HTTP 400", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .set("Content-Type", "application/json")
            .send('{"email":');

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);

        expect(response.body.message)
            .toBe("Invalid JSON request body");

    });


    // ========================================
    // TEST 5: UNAUTHENTICATED ACCESS
    // ========================================

    test("Unauthenticated users cannot create services", async () => {

        const response = await request(app)
            .post("/api/hustles")
            .send({
                title: "Test Service"
            });

        expect(response.status).toBe(401);

    });


    // ========================================
    // TEST 6: CLIENT ROLE RESTRICTION
    // ========================================

    test("Clients cannot create freelancer services", async () => {

        const clientToken = createTestToken("client");

        const response = await request(app)
            .post("/api/hustles")
            .set("Authorization", `Bearer ${clientToken}`)
            .send({
                title: "Unauthorized Service"
            });

        expect(response.status).toBe(403);

    });


    // ========================================
    // TEST 7: FREELANCER ROLE RESTRICTION
    // ========================================

    test("Freelancers cannot create client bookings", async () => {

        const freelancerToken = createTestToken("freelancer");

        const response = await request(app)
            .post("/api/bookings")
            .set("Authorization", `Bearer ${freelancerToken}`)
            .send({
                hustleId: "64b000000000000000000002"
            });

        expect(response.status).toBe(403);

    });


    // ========================================
    // TEST 8: CLIENT FINANCIAL ACCESS
    // ========================================

    test("Clients cannot access freelancer income", async () => {

        const clientToken = createTestToken("client");

        const response = await request(app)
            .get("/api/bookings/freelancer/income")
            .set("Authorization", `Bearer ${clientToken}`);

        expect(response.status).toBe(403);

    });

});