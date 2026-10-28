/*
 * Demo knowledge base (FR-22): ~50 common things tagged with yes/no attributes.
 * Each item lists the attributes that are true (`t`) and "sometimes" true (`s`);
 * everything else is false. engine.test.ts checks every item is reachable.
 */

export type Attribute = {
  id: string;
  question: string;
  /** Status-line phrases, e.g. "it's an animal" / "not an animal". */
  yes: string;
  no: string;
};

export const ATTRIBUTES = [
  { id: "alive", question: "Is it alive?", yes: "it's alive", no: "not alive" },
  { id: "animal", question: "Is it an animal?", yes: "an animal", no: "not an animal" },
  { id: "mammal", question: "Is it a mammal?", yes: "a mammal", no: "not a mammal" },
  { id: "pet", question: "Do people often keep it as a pet?", yes: "a pet", no: "not a pet" },
  { id: "flies", question: "Can it fly?", yes: "it flies", no: "doesn't fly" },
  { id: "water", question: "Is it usually found in or on water?", yes: "found in water", no: "not in water" },
  { id: "nature", question: "Is it found in nature?", yes: "found in nature", no: "not from nature" },
  { id: "plant", question: "Is it a plant, or does it grow on one?", yes: "grows like a plant", no: "not a plant" },
  { id: "food", question: "Do people eat it?", yes: "edible", no: "not food" },
  { id: "sweet", question: "Does it taste sweet?", yes: "sweet", no: "not sweet" },
  { id: "manmade", question: "Is it made by people?", yes: "man-made", no: "not man-made" },
  { id: "electronic", question: "Does it use electricity?", yes: "electric", no: "not electric" },
  { id: "screen", question: "Does it have a screen?", yes: "has a screen", no: "no screen" },
  { id: "wheels", question: "Does it have wheels?", yes: "has wheels", no: "no wheels" },
  { id: "vehicle", question: "Can you ride in it or on it?", yes: "you can ride it", no: "not rideable" },
  { id: "holdable", question: "Can you hold it in one hand?", yes: "fits in a hand", no: "too big to hold" },
  { id: "big", question: "Is it bigger than a person?", yes: "bigger than you", no: "smaller than you" },
  { id: "indoors", question: "Is it usually found indoors?", yes: "lives indoors", no: "not indoors" },
  { id: "kitchen", question: "Is it used in the kitchen?", yes: "a kitchen thing", no: "not for the kitchen" },
  { id: "wearable", question: "Do you wear it?", yes: "wearable", no: "not worn" },
  { id: "furniture", question: "Is it furniture?", yes: "furniture", no: "not furniture" },
  { id: "legs4", question: "Does it have four legs?", yes: "four legs", no: "not four-legged" },
  { id: "wood", question: "Is it usually made of wood?", yes: "wooden", no: "not wooden" },
  { id: "metal", question: "Is it usually made of metal?", yes: "metal", no: "not metal" },
  { id: "sport", question: "Is it used for sports or games?", yes: "for sports", no: "not for sports" },
  { id: "music", question: "Is it used to make music?", yes: "musical", no: "not musical" },
  { id: "dangerous", question: "Can it be dangerous?", yes: "can be dangerous", no: "harmless" },
  { id: "round", question: "Is it round?", yes: "round", no: "not round" },
  { id: "noisy", question: "Does it make noise?", yes: "makes noise", no: "quiet" },
  { id: "paper", question: "Is it made of paper?", yes: "paper", no: "not paper" },
  { id: "tool", question: "Is it a tool?", yes: "a tool", no: "not a tool" },
  { id: "cold", question: "Is it cold?", yes: "cold", no: "not cold" },
  { id: "sky", question: "Is it usually up in the sky?", yes: "in the sky", no: "not in the sky" },
  { id: "climbs", question: "Can it climb?", yes: "a climber", no: "doesn't climb" },
  { id: "farm", question: "Is it found on a farm?", yes: "on a farm", no: "not on a farm" },
  { id: "fruit", question: "Is it a fruit?", yes: "a fruit", no: "not a fruit" },
  { id: "light", question: "Does it give off light?", yes: "gives off light", no: "no light" },
] as const satisfies readonly Attribute[];

export type AttributeId = (typeof ATTRIBUTES)[number]["id"];

export type Item = {
  id: string;
  /** How a guess refers to it: "Is it {phrase}?" */
  phrase: string;
  /** Short candidate label. */
  label: string;
  t: AttributeId[];
  s?: AttributeId[];
};

const item = (label: string, phrase: string, t: AttributeId[], s: AttributeId[] = []): Item => ({
  id: label.toLowerCase().replace(/\s+/g, "-"),
  label,
  phrase,
  t,
  s,
});

export const ITEMS: Item[] = [
  // Animals
  item("Dog", "a dog", ["alive", "animal", "mammal", "pet", "legs4", "noisy"], ["indoors", "dangerous", "farm"]),
  item("Cat", "a cat", ["alive", "animal", "mammal", "pet", "legs4", "indoors", "climbs"], ["noisy", "farm"]),
  item("Horse", "a horse", ["alive", "animal", "mammal", "legs4", "vehicle", "big", "noisy", "farm"], ["pet", "nature", "sport"]),
  item("Cow", "a cow", ["alive", "animal", "mammal", "legs4", "big", "noisy", "farm"], ["food"]),
  item("Elephant", "an elephant", ["alive", "animal", "mammal", "legs4", "big", "noisy", "nature"], ["dangerous", "vehicle"]),
  item("Lion", "a lion", ["alive", "animal", "mammal", "legs4", "nature", "dangerous", "noisy"], ["big"]),
  item("Mouse", "a mouse", ["alive", "animal", "mammal", "legs4", "holdable", "climbs"], ["pet", "nature", "indoors", "farm"]),
  item("Rabbit", "a rabbit", ["alive", "animal", "mammal", "legs4", "pet"], ["holdable", "nature", "farm", "food"]),
  item("Monkey", "a monkey", ["alive", "animal", "mammal", "nature", "climbs", "noisy"], ["dangerous"]),
  item("Whale", "a whale", ["alive", "animal", "mammal", "water", "nature", "big"], ["noisy"]),
  item("Bird", "a bird", ["alive", "animal", "flies", "nature", "noisy", "sky"], ["pet", "holdable"]),
  item("Chicken", "a chicken", ["alive", "animal", "food", "noisy", "farm"], ["flies"]),
  item("Fish", "a fish", ["alive", "animal", "water", "nature", "food"], ["pet", "holdable"]),
  item("Shark", "a shark", ["alive", "animal", "water", "nature", "dangerous"], ["big"]),
  item("Snake", "a snake", ["alive", "animal", "nature", "dangerous"], ["pet", "climbs", "noisy"]),
  item("Butterfly", "a butterfly", ["alive", "animal", "flies", "nature", "holdable"]),
  item("Bee", "a bee", ["alive", "animal", "flies", "nature", "holdable", "noisy"], ["dangerous", "farm"]),
  item("Spider", "a spider", ["alive", "animal", "nature", "holdable", "climbs"], ["indoors", "dangerous"]),

  // Plants
  item("Tree", "a tree", ["alive", "plant", "nature", "big", "wood"], ["fruit"]),
  item("Flower", "a flower", ["alive", "plant", "nature", "holdable"], ["indoors"]),
  item("Cactus", "a cactus", ["alive", "plant", "nature"], ["indoors", "dangerous", "big"]),

  // Food
  item("Apple", "an apple", ["food", "sweet", "holdable", "round", "plant", "fruit"], ["farm", "kitchen"]),
  item("Banana", "a banana", ["food", "sweet", "holdable", "plant", "fruit"], ["kitchen"]),
  item("Carrot", "a carrot", ["food", "holdable", "plant", "farm"], ["kitchen", "sweet"]),
  item("Pizza", "pizza", ["food", "manmade"], ["round", "kitchen", "indoors"]),
  item("Ice cream", "ice cream", ["food", "sweet", "manmade", "cold", "holdable"]),
  item("Bread", "bread", ["food", "manmade", "kitchen"], ["holdable", "indoors"]),
  item("Chocolate", "chocolate", ["food", "sweet", "manmade", "holdable"], ["cold"]),
  item("Egg", "an egg", ["food", "holdable", "round", "farm", "kitchen"]),

  // Electronics
  item("Phone", "a phone", ["manmade", "electronic", "screen", "holdable", "noisy", "light"], ["indoors", "metal"]),
  item("Computer", "a computer", ["manmade", "electronic", "screen", "indoors"], ["noisy", "metal", "tool", "light"]),
  item("Television", "a television", ["manmade", "electronic", "screen", "indoors", "noisy", "light"], ["furniture"]),
  item("Lamp", "a lamp", ["manmade", "electronic", "indoors", "light"], ["furniture", "metal"]),
  item("Refrigerator", "a refrigerator", ["manmade", "electronic", "kitchen", "indoors", "cold", "metal"], ["big", "noisy"]),

  // Vehicles
  item("Car", "a car", ["manmade", "vehicle", "wheels", "metal", "big", "electronic", "noisy"], ["dangerous"]),
  item("Bicycle", "a bicycle", ["manmade", "vehicle", "wheels", "metal"], ["sport"]),
  item("Airplane", "an airplane", ["manmade", "vehicle", "flies", "wheels", "metal", "electronic", "big", "noisy", "sky"]),
  item("Boat", "a boat", ["manmade", "vehicle", "water", "big"], ["wood", "metal", "noisy", "electronic"]),
  item("Train", "a train", ["manmade", "vehicle", "wheels", "metal", "big", "noisy"], ["electronic"]),

  // Furniture & household
  item("Chair", "a chair", ["manmade", "furniture", "indoors", "legs4"], ["wood", "metal"]),
  item("Table", "a table", ["manmade", "furniture", "indoors", "legs4", "wood"], ["kitchen"]),
  item("Bed", "a bed", ["manmade", "furniture", "indoors"], ["wood", "big", "legs4"]),
  item("Spoon", "a spoon", ["manmade", "kitchen", "holdable", "metal", "tool"]),
  item("Knife", "a knife", ["manmade", "kitchen", "holdable", "metal", "tool", "dangerous"]),
  item("Cup", "a cup", ["manmade", "kitchen", "holdable", "indoors"], ["round"]),
  item("Book", "a book", ["manmade", "holdable", "paper"], ["indoors"]),
  item("Pencil", "a pencil", ["manmade", "holdable", "wood", "tool"], ["paper"]),
  item("Hammer", "a hammer", ["manmade", "holdable", "metal", "tool"], ["wood", "dangerous", "noisy"]),

  // Clothing
  item("Shoe", "a shoe", ["manmade", "wearable"], ["holdable", "sport"]),
  item("Hat", "a hat", ["manmade", "wearable", "holdable"], ["round"]),
  item("Watch", "a watch", ["manmade", "wearable", "holdable"], ["electronic", "metal", "round", "screen"]),

  // Play & music
  item("Ball", "a ball", ["manmade", "sport", "round"], ["holdable"]),
  item("Guitar", "a guitar", ["manmade", "music", "wood", "noisy"], ["electronic"]),
  item("Piano", "a piano", ["manmade", "music", "wood", "noisy", "indoors", "big"], ["furniture", "legs4"]),

  // Nature
  item("Sun", "the sun", ["nature", "round", "big", "sky", "light"], ["dangerous"]),
  item("Moon", "the moon", ["nature", "round", "big", "sky"], ["cold", "light"]),
  item("Snow", "snow", ["nature", "cold", "water"], ["sky", "sport"]),
  item("Rock", "a rock", ["nature"], ["holdable", "dangerous", "round"]),
];
