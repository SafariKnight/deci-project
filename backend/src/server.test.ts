import "./env.ts"
import app from "./app.ts"
import request, { Response } from "supertest"

describe("THAT'S A SPICY MEAT-A-BALL", () => {
  it("Health Check", (done) => {
    request(app)
      .get("/health")
      .expect(200)
      .expect({ status: "OK" })
      .end(function(err: Error, _res: Response) {
        if (err) return done(err);
        return done();
      });
  })
})
