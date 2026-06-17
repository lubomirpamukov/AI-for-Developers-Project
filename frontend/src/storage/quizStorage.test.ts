import { STORAGE_KEYS } from "@quizmaker/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  loadPreferences,
  loadStoredDecks,
  savePreferences,
  saveStoredDecks
} from "./quizStorage.js";

describe("quizStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("uses the versioned deck storage key", () => {
    const decks = [
      {
        deckId: "deck-1",
        topic: "TypeScript",
        difficulty: "beginner" as const,
        cards: [],
        createdAt: "2026-06-16T00:00:00.000Z"
      }
    ];

    saveStoredDecks(decks);

    expect(localStorage.getItem(STORAGE_KEYS.decks)).toBe(JSON.stringify(decks));
    expect(loadStoredDecks()).toEqual(decks);
  });

  it("does not persist API key-shaped preferences", () => {
    savePreferences({ lastDifficulty: "advanced", lastCount: 10 });

    const storedPreferences = localStorage.getItem(STORAGE_KEYS.preferences);

    expect(storedPreferences).toBe(JSON.stringify({ lastDifficulty: "advanced", lastCount: 10 }));
    expect(storedPreferences).not.toContain("apiKey");
  });

  it("falls back safely when localStorage reads fail", () => {
    const getItem = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("storage disabled");
      });

    expect(loadStoredDecks()).toEqual([]);
    expect(loadPreferences()).toEqual({});

    getItem.mockRestore();
  });

  it("does not throw when localStorage writes fail", () => {
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });

    expect(() => saveStoredDecks([])).not.toThrow();

    setItem.mockRestore();
  });
});
