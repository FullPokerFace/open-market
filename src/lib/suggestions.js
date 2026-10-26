// Server-only: the public feature-suggestion board, one MongoDB document per feature:
// { title, description, icon, messages: [{ text, createdAt }], up: [voter], down: [voter], score, createdAt, hidden }
// `messages` holds every visitor's own words, so a duplicate adds to the original instead of making a new card.
// `voter` is a SHA-256 of the visitor's anonymous cookie id; set `hidden: true` by hand to take a card off the board.
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { ObjectId } from "mongodb";
import { COLLECTIONS, getDb } from "./db";

export const VOTER_COOKIE = "om_voter";
const VOTER_MAX_AGE = 60 * 60 * 24 * 365 * 2; // seconds
const BOARD_LIMIT = 300;
// Cards the model compares a new suggestion against when looking for duplicates
const DUPLICATE_CHECK_LIMIT = 150;

const visible = { hidden: { $ne: true } };

let indexed = null;
async function getSuggestions() {
  const suggestions = (await getDb()).collection(COLLECTIONS.suggestions);
  indexed ??= suggestions.createIndex({ hidden: 1, score: -1, createdAt: -1 }).catch((error) => {
    indexed = null;
    console.error("[db] suggestions index", error);
  });
  return suggestions;
}

const hashVoter = (id) => createHash("sha256").update(id).digest("hex");

// The visitor's voter hash from their cookie, making the cookie first if `create` (on writes);
// null for a first-time visitor who's only reading. `cookieStore` is `await cookies()`.
export function voterFrom(cookieStore, { create = false } = {}) {
  let id = cookieStore.get(VOTER_COOKIE)?.value;
  if (!/^[0-9a-f-]{36}$/.test(id ?? "")) {
    if (!create) return null;
    id = randomUUID();
    cookieStore.set(VOTER_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: VOTER_MAX_AGE,
    });
  }
  return hashVoter(id);
}

export const parseId = (id) => (typeof id === "string" && /^[0-9a-f]{24}$/.test(id) ? new ObjectId(id) : null);

// What the board shows for one card, with this visitor's vote: 1, -1 or 0
const cardFields = (voter) => ({
  _id: 0,
  id: { $toString: "$_id" },
  title: 1,
  description: 1,
  icon: 1,
  score: 1,
  requests: { $size: "$messages" },
  myVote: voter
    ? { $cond: [{ $in: [voter, "$up"] }, 1, { $cond: [{ $in: [voter, "$down"] }, -1, 0] }] }
    : { $literal: 0 },
  createdAt: 1,
});

async function findCard(suggestions, _id, voter) {
  const [card] = await suggestions.aggregate([{ $match: { _id, ...visible } }, { $project: cardFields(voter) }]).toArray();
  return card ?? null;
}

// The board, most votes first and newest first among equal scores
export async function listSuggestions(voter) {
  const suggestions = await getSuggestions();
  return suggestions
    .aggregate([{ $match: visible }, { $sort: { score: -1, createdAt: -1 } }, { $limit: BOARD_LIMIT }, { $project: cardFields(voter) }])
    .toArray();
}

// [{ id, title, description }] for the duplicate check
export async function suggestionsToCompare() {
  const suggestions = await getSuggestions();
  const docs = await suggestions
    .find(visible, { projection: { title: 1, description: 1 }, sort: { score: -1, createdAt: -1 }, limit: DUPLICATE_CHECK_LIMIT })
    .toArray();
  return docs.map(({ _id, title, description }) => ({ id: _id.toString(), title, description }));
}

// Saves a new card with its author's upvote, or, when `duplicateOf` is set, adds the message and
// the author's upvote to that card. Returns the card as the board shows it.
export async function saveSuggestion({ message, card, voter }) {
  const suggestions = await getSuggestions();
  const now = new Date();
  const entry = { text: message, createdAt: now };

  const original = card.duplicateOf && parseId(card.duplicateOf);
  if (original) {
    await suggestions.updateOne({ _id: original }, [
      { $set: { messages: { $concatArrays: ["$messages", [{ $literal: entry }]] } } },
      ...voteStages(voter, 1),
    ]);
    const merged = await findCard(suggestions, original, voter);
    if (merged) return merged;
    // Hidden or removed since the check: save it on its own instead
  }

  const { insertedId } = await suggestions.insertOne({
    title: card.title,
    description: card.description,
    icon: card.icon,
    messages: [entry],
    up: [voter],
    down: [],
    score: 1,
    createdAt: now,
  });
  return findCard(suggestions, insertedId, voter);
}

// Update-pipeline stages that set `voter`'s vote (1 up, -1 down, 0 none) and recount the score,
// in one atomic update so votes arriving together can't lose each other
function voteStages(voter, value) {
  const set = (field, include) => (include ? { $setUnion: [`$${field}`, [voter]] } : { $setDifference: [`$${field}`, [voter]] });
  return [
    { $set: { up: set("up", value === 1), down: set("down", value === -1) } },
    { $set: { score: { $subtract: [{ $size: "$up" }, { $size: "$down" }] } } },
  ];
}

// The card after the vote, or null when there's no such card
export async function voteSuggestion({ id, voter, value }) {
  const suggestions = await getSuggestions();
  const { matchedCount } = await suggestions.updateOne({ _id: id, ...visible }, voteStages(voter, value));
  return matchedCount ? findCard(suggestions, id, voter) : null;
}
