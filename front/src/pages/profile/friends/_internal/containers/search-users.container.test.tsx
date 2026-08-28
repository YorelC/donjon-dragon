import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { SearchUsersContainer } from "./search-users.container";

vi.mock("../queries/use-search-users");
vi.mock("../hooks/use-user-invitation");

let inView = false;
vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: vi.fn(), inView }),
}));

import * as useSearchUsersModule from "../queries/use-search-users";
import * as useUserInvitationModule from "../hooks/use-user-invitation";

// ── Helpers ──────────────────────────────────────────────────────────────────

function mockSearchUsersReturn(overrides: Partial<ReturnType<typeof useSearchUsersModule.useSearchUsers>> = {}) {
  return {
    data: [],
    isLoading: false,
    isError: false,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    ...overrides,
  } as unknown as ReturnType<typeof useSearchUsersModule.useSearchUsers>;
}

function typeQuery(value: string) {
  const input = screen.getByLabelText("Rechercher un joueur");
  fireEvent.change(input, { target: { value } });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("SearchUsersContainer", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    inView = false;
    vi.mocked(useSearchUsersModule.useSearchUsers).mockReturnValue(mockSearchUsersReturn());
    vi.mocked(useUserInvitationModule.useUserInvitation).mockReturnValue({
      onSend: vi.fn(),
      pendingRecipients: new Set(),
      friendNames: new Set(),
      sendingTo: null,
    });
  });

  it("n'affiche aucun bouton de soumission", () => {
    render(<SearchUsersContainer />);

    expect(screen.queryByRole("button", { name: /Chercher/i })).not.toBeInTheDocument();
  });

  describe("recherche live débouncée", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("n'appelle pas la recherche avant 3 caractères", () => {
      render(<SearchUsersContainer />);

      typeQuery("ab");
      act(() => vi.advanceTimersByTime(300));

      expect(useSearchUsersModule.useSearchUsers).toHaveBeenLastCalledWith("");
    });

    it("déclenche la recherche 300ms après le 3e caractère", () => {
      render(<SearchUsersContainer />);

      typeQuery("abc");
      act(() => vi.advanceTimersByTime(299));
      expect(useSearchUsersModule.useSearchUsers).not.toHaveBeenLastCalledWith("abc");

      act(() => vi.advanceTimersByTime(1));
      expect(useSearchUsersModule.useSearchUsers).toHaveBeenLastCalledWith("abc");
    });
  });

  describe("scroll infini", () => {
    it("appelle fetchNextPage quand la sentinelle intersecte et qu'il reste une page", () => {
      inView = true;
      const fetchNextPage = vi.fn();
      vi.mocked(useSearchUsersModule.useSearchUsers).mockReturnValue(
        mockSearchUsersReturn({ hasNextPage: true, fetchNextPage }),
      );

      render(<SearchUsersContainer />);

      expect(fetchNextPage).toHaveBeenCalledTimes(1);
    });

    it("n'appelle pas fetchNextPage si aucune page suivante n'existe", () => {
      inView = true;
      const fetchNextPage = vi.fn();
      vi.mocked(useSearchUsersModule.useSearchUsers).mockReturnValue(
        mockSearchUsersReturn({ hasNextPage: false, fetchNextPage }),
      );

      render(<SearchUsersContainer />);

      expect(fetchNextPage).not.toHaveBeenCalled();
    });

    it("n'appelle pas fetchNextPage si la sentinelle n'est pas visible", () => {
      inView = false;
      const fetchNextPage = vi.fn();
      vi.mocked(useSearchUsersModule.useSearchUsers).mockReturnValue(
        mockSearchUsersReturn({ hasNextPage: true, fetchNextPage }),
      );

      render(<SearchUsersContainer />);

      expect(fetchNextPage).not.toHaveBeenCalled();
    });
  });
});
