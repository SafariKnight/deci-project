import "#/config/env.ts"
import { createAccessToken, verifyJWT } from "./jwtService.ts"

const testData = { test: "data" }

describe("JWT Controller Signing & Verifying", () => {
  it("Signs and verifys correctly", async () => {
    const jwt = await createAccessToken(testData)
    const data = await verifyJWT(jwt)

    expect(data.test).toEqual(testData.test)
  })

  it("Payload contains ONLY iat & exp by default", async () => {
    const jwt = await createAccessToken({})
    const data = await verifyJWT(jwt)


    expect(data.exp).toBeDefined()
    expect(data.iat).toBeDefined()
    expect(data.iss).toBeUndefined()
    expect(data.aud).toBeUndefined()
    expect(data.iss).toBeUndefined()
    expect(data.jti).toBeUndefined()
  })
} )
