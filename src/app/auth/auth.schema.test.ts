import { describe, expect, it } from "vitest";

import { LoginSearchSchema } from "./auth.schema";

describe("LoginSearchSchema", () => {
  it("keeps a single from value", () => {
    expect(LoginSearchSchema.parse({ from: "/finances" })).toEqual({ from: "/finances" });
  });

  it("drops repeated from values instead of failing validation", () => {
    expect(LoginSearchSchema.parse({ from: ["/finances", "/applications"] })).toEqual({});
  });

  it("allows a missing from value", () => {
    expect(LoginSearchSchema.parse({})).toEqual({});
  });
});
