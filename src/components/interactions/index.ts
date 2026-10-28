import { ChatReplies } from "./ChatReplies";
import { SpectrumSlider } from "./SpectrumSlider";
import { SwipeCard } from "./SwipeCard";
import type { AnswerInteraction } from "./types";

export const ANSWER_INTERACTIONS: AnswerInteraction[] = [
  {
    id: "swipe",
    name: "Swipe",
    idea: "Answering as a gesture. Throw the card: right Yes, left No, up Sometimes, down Unsure.",
    Component: SwipeCard,
  },
  {
    id: "spectrum",
    name: "Spectrum",
    idea: "Answering as a position. Sometimes sits between No and Yes; Unsure is a skip off the scale.",
    Component: SpectrumSlider,
  },
  {
    id: "chat",
    name: "Chat",
    idea: "Answering as a reply. Quick replies in your voice fly up into a conversation with the AI.",
    Component: ChatReplies,
  },
];

export type { AnswerInteractionProps } from "./types";
