import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

export interface SearchPagination {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  sentinelRef: (node?: Element | null) => void;
}

interface InfiniteScrollTriggerInput {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function useInfiniteScrollTrigger(
  input: InfiniteScrollTriggerInput,
): SearchPagination {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && input.hasNextPage && !input.isFetchingNextPage) {
      input.onLoadMore();
    }
  }, [inView, input.hasNextPage, input.isFetchingNextPage, input.onLoadMore]);

  return {
    hasNextPage: input.hasNextPage,
    isFetchingNextPage: input.isFetchingNextPage,
    sentinelRef: ref,
  };
}
