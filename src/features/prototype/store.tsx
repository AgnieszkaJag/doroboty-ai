import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { STORAGE_KEY, type StoragePort } from "./storage";
import { createScenarioStore } from "./scenario-store";
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const [controller] = useState(() => createScenarioStore(browserStorage));
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot);
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    const onStorage = (event: StorageEvent) => {
      if (
        event.storageArea === browserStorage() &&
        (event.key === STORAGE_KEY || event.key === null)
      )
        controller.sync();
    };
    const onFocus = () => controller.sync();
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    controller.sync();
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [controller]);
  return {
    ...snapshot,
    run: controller.run,
    importState: controller.importState,
    clearError: controller.clearError,
    reset: controller.reset,
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
