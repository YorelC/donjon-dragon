import { describe, expect, it } from "vitest";
import { DOMAIN_ERROR_CODE } from "@donjon-dragon/shared";
import { ApiError } from "@/shared/api/api";
import { toRegisterErrorMessage } from "./use-register-form";

// Le bug : tout 409 affichait « Cette adresse email est deja utilisee ». Un joueur
// dont le PSEUDO collisionnait changeait donc d'email en boucle sans comprendre
// pourquoi ca echouait toujours.

describe("toRegisterErrorMessage", () => {
  it("désigne l'email quand c'est l'email qui collisionne", () => {
    const message = toRegisterErrorMessage(
      new ApiError(
        409,
        "Email already in use",
        DOMAIN_ERROR_CODE["email-already-in-use"],
      ),
    );

    expect(message).toContain("adresse email");
    expect(message).not.toContain("pseudo");
  });

  it("désigne le pseudo quand c'est le pseudo qui collisionne", () => {
    const message = toRegisterErrorMessage(
      new ApiError(
        409,
        "Display name already taken",
        DOMAIN_ERROR_CODE["display-name-already-taken"],
      ),
    );

    expect(message).toContain("pseudo");
    expect(message).not.toContain("adresse email");
  });

  it("reste prudent sur un 409 sans code", () => {
    // Le back n'en emet plus sans code, mais un proxy ou une version anterieure
    // peuvent le faire : mieux vaut un message vague qu'un message faux.
    expect(toRegisterErrorMessage(new ApiError(409, "Conflict"))).toContain(
      "email ou ce pseudo",
    );
  });

  it("ne confond pas un autre statut avec un conflit", () => {
    expect(toRegisterErrorMessage(new ApiError(400, "Bad Request"))).toContain(
      "Erreur lors de l'inscription",
    );
  });

  it.each([
    ["une erreur quelconque", new Error("réseau coupé")],
    ["une valeur qui n'est pas une erreur", "boom"],
    ["undefined", undefined],
  ])("garde un message generique pour %s", (_name, thrown) => {
    expect(toRegisterErrorMessage(thrown)).toContain("Erreur lors de l'inscription");
  });

  // Exhaustivite : si un code est ajoute a shared sans message ici, le Record du
  // module ne compile plus. Ce test verifie qu'aucun code connu ne rend undefined.
  it("a un message pour chaque code métier existant", () => {
    for (const code of Object.values(DOMAIN_ERROR_CODE)) {
      expect(toRegisterErrorMessage(new ApiError(409, "peu importe", code))).toBeTruthy();
    }
  });
});
