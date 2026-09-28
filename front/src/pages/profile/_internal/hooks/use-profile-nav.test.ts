import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useProfileNav } from "./use-profile-nav";
import { toProfileNavItems } from "../constants/profile-nav-items";

const counts = { campaignInvitations: 3, friendRequests: 0 };

vi.mock("./use-profile-nav-counts", () => ({ useProfileNavCounts: () => counts }));

describe("useProfileNav", () => {
  it("should initialize with isMenuOpen as false", () => {
    const { result } = renderHook(() => useProfileNav());
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("should toggle menu open and closed", () => {
    const { result } = renderHook(() => useProfileNav());

    expect(result.current.isMenuOpen).toBe(false);

    act(() => {
      result.current.toggleMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);

    act(() => {
      result.current.toggleMenu();
    });
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("should close menu", () => {
    const { result } = renderHook(() => useProfileNav());

    act(() => {
      result.current.toggleMenu();
    });
    expect(result.current.isMenuOpen).toBe(true);

    act(() => {
      result.current.closeMenu();
    });
    expect(result.current.isMenuOpen).toBe(false);
  });

  it("should return correct items", () => {
    const { result } = renderHook(() => useProfileNav());
    expect(result.current.items).toEqual(toProfileNavItems(counts));
  });
});
