import "./config/env.ts";
import app from "./app.js";
import request, { Response } from "supertest";

describe("server.ts", () => {
  it("Health Check", (done) => {
    request(app)
      .get("/health")
      .expect(200)
      .expect({ status: "OK" })
      .end(function (err: Error, _res: Response) {
        if (err) return done(err);
        return done();
      });
  });
});
