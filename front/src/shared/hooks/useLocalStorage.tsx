import { useState } from "react";

// Type générique pour pouvoir l'utiliser avec n'importe quelle structure de données.
function useLocalStorage<T>(key: string, initialValue: T) {
  // Obtenir les éléments du local storage au départ
  const storedValue = localStorage.getItem(key);
  const initial = storedValue ? JSON.parse(storedValue) : initialValue;

  // State pour conserver la valeur actuelle
  const [value, setValue] = useState<T>(initial);

  // Fonction pour mettre à jour le state et le localStorage
  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    // Permettre la mise à jour fonctionnelle
    const valueToStore =
      newValue instanceof Function ? newValue(value) : newValue;

    // Mettre à jour le state
    setValue(valueToStore);

    // Mettre à jour le localStorage
    localStorage.setItem(key, JSON.stringify(valueToStore));
  };

  return [value, setStoredValue] as const;
}

export default useLocalStorage;
