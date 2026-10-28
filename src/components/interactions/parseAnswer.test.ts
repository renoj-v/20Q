import { describe, expect, it } from "vitest";
import { parseAnswer } from "./parseAnswer";

describe("parseAnswer", () => {
  it.each([
    ["yes", "yes"],
    ["Yeah!", "yes"],
    ["yep", "yes"],
    ["that's it", "yes"],
    ["y", "yes"],
    ["no", "no"],
    ["Nope.", "no"],
    ["not really", "no"],
    ["n", "no"],
    ["sometimes", "sometimes"],
    ["kinda", "sometimes"],
    ["yeah kind of", "sometimes"],
    ["maybe", "sometimes"],
    ["not sure", "unsure"],
    ["I don't know", "unsure"],
    ["idk", "unsure"],
    ["u", "unsure"],
  ])("%s → %s", (text, expected) => {
    expect(parseAnswer(text)).toBe(expected);
  });

  it("returns null for gibberish or empty input", () => {
    expect(parseAnswer("banana")).toBeNull();
    expect(parseAnswer("   ")).toBeNull();
  });

  it("rejects answers outside the allowed set (guess turns)", () => {
    expect(parseAnswer("kinda", ["yes", "no"])).toBeNull();
    expect(parseAnswer("yes!", ["yes", "no"])).toBe("yes");
  });
});
