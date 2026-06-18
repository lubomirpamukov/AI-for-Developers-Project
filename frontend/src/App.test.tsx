import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS } from "@quizmaker/shared";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./App.js";

describe("App scaffold", () => {
  afterEach(() => {
    cleanup();
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
    await user.click(screen.getByRole("button", { name: "Prepare deck request" }));

    expect(screen.getByText("Topic is required.")).toBeInTheDocument();
    expect(screen.getByText("Count must be between 1 and 20.")).toBeInTheDocument();
  });

  it("lets the user choose OpenAI as the generation provider", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("Topic"), "React state");
    await user.selectOptions(screen.getByLabelText("Provider"), "openai");
    await user.click(screen.getByRole("button", { name: "Prepare deck request" }));

    expect(
      screen.getByText("OpenAI will shape 5 beginner cards about React state")
    ).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEYS.preferences)).toBe(
      JSON.stringify({
        lastDifficulty: "beginner",
        lastCount: 5,
        lastProvider: "openai"
      })
    );
  });
});
