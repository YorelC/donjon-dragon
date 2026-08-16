import { useQuery } from "@tanstack/react-query";
import type { Item } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Le catalogue d'objets du manuel. Comme celui des règles, il ne change qu'à une
 * errata : chargé une fois, gardé toute la session.
 */
export const itemCatalogKey = ["items", "catalog"] as const;

export function useItemCatalog() {
  return useQuery({
    queryKey: itemCatalogKey,
    queryFn: () => api.get<Item[]>(API_ROUTES.items.list()),
    staleTime: Infinity,
  });
}

/** Les objets par clé : une ligne d'inventaire n'a que sa clé à montrer sinon. */
export function itemsByKey(items: Item[]): Map<string, Item> {
  return new Map(items.map((item) => [item.key, item]));
}
