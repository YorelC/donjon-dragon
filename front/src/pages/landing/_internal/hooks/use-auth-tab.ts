import { useSearchParams } from "react-router-dom";
import {
  AUTH_TAB,
  AUTH_TAB_PARAM,
  isAuthTab,
  type AuthTab,
} from "@/shared/constants/auth-tab";

/**
 * L'onglet sur lequel ouvrir le panneau d'accès. `/register` et `/login`
 * redirigent ici avec le paramètre : l'ancienne adresse reste un lien valide.
 */
export function useAuthTab(): AuthTab {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get(AUTH_TAB_PARAM);

  return isAuthTab(requested) ? requested : AUTH_TAB.signup;
}
