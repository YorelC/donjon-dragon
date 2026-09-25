import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordInput } from "./password-input";

describe("PasswordInput", () => {
  it("transmet la ref au champ de mot de passe", () => {
    const ref = React.createRef<HTMLInputElement>();

    render(<PasswordInput ref={ref} aria-label="Mot de passe" />);

    expect(ref.current).toBe(screen.getByLabelText("Mot de passe"));
  });
});
