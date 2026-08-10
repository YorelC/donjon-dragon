import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInfiniteScrollTrigger } from "./use-infinite-scroll-trigger";

let inView = false;
const observerRef = vi.fn();

vi.mock("react-intersection-observer", () => ({
  useInView: () => ({ ref: observerRef, inView }),
}));

describe("useInfiniteScrollTrigger", () => {
  beforeEach(() => {
    inView = false;
    observerRef.mockClear();
  });

  it("n'appelle pas onLoadMore si la sentinelle n'est pas visible", () => {
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: false, onLoadMore }),
    );

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("appelle onLoadMore quand la sentinelle devient visible et qu'il reste une page", () => {
    inView = true;
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: false, onLoadMore }),
    );

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onLoadMore si aucune page suivante n'existe", () => {
    inView = true;
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScrollTrigger({ hasNextPage: false, isFetchingNextPage: false, onLoadMore }),
    );

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("n'appelle pas onLoadMore si une page est déjà en cours de chargement", () => {
    inView = true;
    const onLoadMore = vi.fn();
    renderHook(() =>
      useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: true, onLoadMore }),
    );

    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("expose sentinelRef, hasNextPage et isFetchingNextPage", () => {
    const { result } = renderHook(() =>
      useInfiniteScrollTrigger({ hasNextPage: true, isFetchingNextPage: false, onLoadMore: vi.fn() }),
    );

    expect(result.current.sentinelRef).toBe(observerRef);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.isFetchingNextPage).toBe(false);
  });
});
