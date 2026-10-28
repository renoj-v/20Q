import { ChatReplies } from "./ChatReplies";
import { Dial } from "./Dial";
import { HoldToAnswer } from "./HoldToAnswer";
import { Reactions } from "./Reactions";
import { SayIt } from "./SayIt";
import { SpectrumSlider } from "./SpectrumSlider";
import { SwipeCard } from "./SwipeCard";
import { TypeIt } from "./TypeIt";
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
  {
    id: "hold",
    name: "Hold",
    idea: "Answering as commitment. Press and hold until it fills; let go early to cancel.",
    Component: HoldToAnswer,
  },
  {
    id: "voice",
    name: "Voice",
    idea: "Answering out loud, like the parlour game. Say “yeah”, “nope”, “kinda”, or “no idea”.",
    Component: SayIt,
  },
  {
    id: "type",
    name: "Type",
    idea: "Answering in your own words, terminal-style. A live hint shows how your words will be read.",
    Component: TypeIt,
  },
  {
    id: "reactions",
    name: "Reactions",
    idea: "Answering as a feeling. React to the question like a message: 👍 👎 🤏 🤷.",
    Component: Reactions,
  },
  {
    id: "dial",
    name: "Dial",
    idea: "Answering as a setting. Turn the knob to a detent, then lock it in — two deliberate steps.",
    Component: Dial,
  },
];

export type { AnswerInteractionProps } from "./types";
