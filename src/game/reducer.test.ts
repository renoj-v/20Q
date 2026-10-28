import { describe, expect, it } from "vitest";
import { gameReducer, initialGameState, type GameAction } from "./reducer";
import { countedQuestions } from "./rules";
import type { AiTurn, Answer, GameState } from "./types";

const question = (text: string): AiTurn => ({ kind: "question", text, statusLine: "", candidates: [] });
const guess = (text: string): AiTurn => ({ kind: "guess", text, statusLine: "", candidates: [] });

function run(actions: GameAction[], state: GameState = initialGameState) {
  return actions.reduce(gameReducer, state);
}

/** Starts a game and plays `answers` against generic questions. */
function playAnswers(answers: Answer[]) {
  let state = run([{ type: "start" }]);
  answers.forEach((answer, i) => {
    state = run([{ type: "request/done", id: String(i), ai: question(`Q${i}`) }, { type: "answer", answer }], state);
  });
  return state;
}

describe("gameReducer", () => {
  it("does not count unsure answers", () => {
    const state = playAnswers(["yes", "unsure", "no", "unsure"]);
    expect(countedQuestions(state.turns)).toBe(2);
    expect(state.request.status).toBe("sending");
  });

  it("loses after 20 counted questions", () => {
    const state = playAnswers(Array(20).fill("no"));
    expect(state.phase).toBe("lost");
    expect(state.endReason).toBe("out_of_questions");
  });

  it("wins on a confirmed guess, continues on a wrong one", () => {
    let state = playAnswers(["yes"]);
    state = run([{ type: "request/done", id: "g", ai: guess("Is it a dog?") }, { type: "answer", answer: "no" }], state);
    expect(state.phase).toBe("playing");
    expect(countedQuestions(state.turns)).toBe(2);
    state = run([{ type: "request/done", id: "g2", ai: guess("Is it a cat?") }, { type: "answer", answer: "yes" }], state);
    expect(state.phase).toBe("won");
  });

  it("rewinds on edit, discarding later turns and refunding the counter", () => {
    let state = playAnswers(["yes", "no", "no", "yes"]);
    state = run([{ type: "edit", index: 1, answer: "yes" }], state);
    expect(state.turns).toHaveLength(2);
    expect(state.turns[1].answer).toBe("yes");
    expect(countedQuestions(state.turns)).toBe(2);
    expect(state.editsUsed).toBe(1);
    expect(state.request.status).toBe("sending");
  });

  it("can rewind out of a lost game", () => {
    let state = playAnswers(Array(20).fill("no"));
    state = run([{ type: "edit", index: 5, answer: "yes" }], state);
    expect(state.phase).toBe("playing");
    expect(state.endReason).toBeNull();
  });

  it("ignores answers while a request is in flight", () => {
    const state = run([{ type: "start" }, { type: "answer", answer: "yes" }]);
    expect(state.turns).toHaveLength(0);
  });
});
