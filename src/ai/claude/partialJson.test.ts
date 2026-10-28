import { describe, expect, it } from "vitest";
import { readPartialTurn } from "./partialJson";

const full = JSON.stringify({
  kind: "question",
  statusLine: "Narrowing down: an animal…",
  candidates: [{ label: "Dog [pet]", confidence: 0.4 }],
  text: 'Is it "furry"?',
});

describe("readPartialTurn", () => {
  it("reads a complete object", () => {
    expect(readPartialTurn(full)).toEqual(JSON.parse(full));
  });

  it("streams text before it closes", () => {
    const cut = full.slice(0, full.indexOf("furry") + 3);
    expect(readPartialTurn(cut).text).toBe('Is it "fur');
    expect(readPartialTurn(cut).candidates).toHaveLength(1);
  });

  it("omits incomplete metadata", () => {
    const cut = full.slice(0, full.indexOf("Narrowing") + 5);
    expect(readPartialTurn(cut)).toEqual({ kind: "question" });
  });
});
