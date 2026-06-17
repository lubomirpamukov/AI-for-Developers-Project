import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App.js";

describe("App scaffold", () => {
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
});
