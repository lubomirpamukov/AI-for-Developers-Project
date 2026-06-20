import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS, type GenerateFlashcardsResponse } from "@quizmaker/shared";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App.js";

const generatedDeck: GenerateFlashcardsResponse = {
  deckId: "deck-1",
  topic: "React state",
  difficulty: "beginner",
  cards: [
    {
      id: "card-1",
      question: "What is React state?",
      answer: "Data a component remembers while it renders."
    }
  ]
};

describe("App scaffold", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("validates generation input before preparing a deck request", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("Topic"));
    await user.clear(screen.getByLabelText("Cards"));
    await user.type(screen.getByLabelText("Cards"), "21");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    expect(screen.getByText("Topic is required.")).toBeInTheDocument();
    expect(screen.getByText("Count must be between 1 and 20.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("generates a deck with Gemini and never persists the one-request API key", async () => {
    const user = userEvent.setup();
    const fetchMock = mockJsonFetch(generatedDeck);
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.clear(screen.getByLabelText("Cards"));
    await user.type(screen.getByLabelText("Cards"), "1");
    await user.type(screen.getByLabelText("Gemini one-request API key"), "secret-key");
    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    expect(await screen.findByText("What is React state?")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate-flashcards",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          topic: "React state",
          difficulty: "beginner",
          count: 1,
          provider: "gemini",
          apiKey: "secret-key"
        })
      })
    );
    expect(
      screen.getByText("Gemini / beginner / 1 card")
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.preferences)).toBe(
      JSON.stringify({
        lastDifficulty: "beginner",
        lastCount: 1,
        lastProvider: "gemini"
      })
    );
    expect(localStorage.getItem(STORAGE_KEYS.preferences) ?? "").not.toContain("secret-key");
    expect(localStorage.getItem(STORAGE_KEYS.decks) ?? "").not.toContain("secret-key");
  });

  it("opens the generated deck in a modal and flips a flashcard", async () => {
    const user = userEvent.setup();
    mockJsonFetch(generatedDeck);
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.clear(screen.getByLabelText("Cards"));
    await user.type(screen.getByLabelText("Cards"), "1");
    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    const deckTrigger = await screen.findByRole("button", {
      name: "Open React state flashcard deck"
    });
    await user.click(deckTrigger);

    expect(screen.getByRole("dialog", { name: "React state" })).toBeInTheDocument();
    expect(screen.getByTestId("deck-card-spread")).toBeInTheDocument();

    const flashcard = screen.getByRole("button", { name: "What is React state?" });
    expect(flashcard).toHaveAttribute("aria-pressed", "false");

    await user.click(flashcard);

    expect(
      screen.getByRole("button", {
        name: "Data a component remembers while it renders."
      })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("closes the deck modal from the backdrop and restores focus", async () => {
    const user = userEvent.setup();
    mockJsonFetch(generatedDeck);
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    const deckTrigger = await screen.findByRole("button", {
      name: "Open React state flashcard deck"
    });
    await user.click(deckTrigger);
    await user.click(screen.getByTestId("deck-modal-overlay"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "React state" })).not.toBeInTheDocument();
    });
    expect(deckTrigger).toHaveFocus();
  });

  it("supports keyboard opening, card flipping, and Escape closing", async () => {
    const user = userEvent.setup();
    mockJsonFetch(generatedDeck);
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    const deckTrigger = await screen.findByRole("button", {
      name: "Open React state flashcard deck"
    });
    deckTrigger.focus();
    await user.keyboard("{Enter}");

    expect(screen.getByRole("button", { name: "Close flashcard deck" })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "What is React state?" })).toHaveFocus();

    await user.keyboard(" ");
    expect(
      screen.getByRole("button", {
        name: "Data a component remembers while it renders."
      })
    ).toHaveFocus();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "React state" })).not.toBeInTheDocument();
    });
    expect(deckTrigger).toHaveFocus();
  });

  it("shows a loading state while the deck request is in flight", async () => {
    const user = userEvent.setup();
    let resolveFetch: (response: Response) => void = () => {};
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal("fetch", vi.fn(() => fetchPromise));
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    expect(screen.getByRole("button", { name: "Generating deck" })).toBeDisabled();

    resolveFetch(jsonResponse(generatedDeck));
    expect(await screen.findByText("What is React state?")).toBeInTheDocument();
  });

  it("shows a safe error when generation fails", async () => {
    const user = userEvent.setup();
    mockJsonFetch(
      {
        error: "We could not generate flashcards right now. Please try again.",
        code: "GENERATION_FAILED"
      },
      502
    );
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.click(screen.getByRole("button", { name: "Generate deck" }));

    expect(
      await screen.findByText("We could not generate flashcards right now. Please try again.")
    ).toHaveAttribute("role", "alert");
  });
});

function mockJsonFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => jsonResponse(body, status));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}
