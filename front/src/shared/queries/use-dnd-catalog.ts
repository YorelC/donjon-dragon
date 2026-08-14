import { useQuery } from "@tanstack/react-query";
import type { CatalogSpellList, DndCatalog } from "@donjon-dragon/shared";
import { api } from "@/shared/api/api";
import { API_ROUTES } from "@/shared/constants/api-routes";

/**
 * Le catalogue ne change qu'à une errata du PHB : une fois chargé, il n'a aucune
 * raison d'être redemandé pendant la session. D'où `staleTime: Infinity` — sans
 * lui, chaque étape du builder qui remonte rejouerait la requête.
 */
export const dndCatalogKey = ["dnd", "catalog"] as const;

export function useDndCatalog() {
  return useQuery({
    queryKey: dndCatalogKey,
    queryFn: () => api.get<DndCatalog>(API_ROUTES.dnd.catalog()),
    staleTime: Infinity,
  });
}

export const classSpellsKey = (classKey: string) =>
  ["dnd", "spells", classKey] as const;

/** Les sorts d'une classe, chargés seulement quand l'étape des sorts s'ouvre. */
export function useClassSpells(classKey: string | null) {
  return useQuery({
    queryKey: classSpellsKey(classKey ?? ""),
    queryFn: () => api.get<CatalogSpellList>(API_ROUTES.dnd.spells(classKey ?? "")),
    enabled: classKey !== null,
    staleTime: Infinity,
  });
}
