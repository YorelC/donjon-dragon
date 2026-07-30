import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsView } from "./settings.view";

describe("SettingsView", () => {
  it("should display settings coming soon message", () => {
    render(<SettingsView />);

    const message = screen.getByText(/bientot disponible/i);
    expect(message).toBeInTheDocument();
  });
});
