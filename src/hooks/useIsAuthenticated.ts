import { usePassword } from "./usePassword";

const useIsAuthenticated = () => usePassword() !== null;

export { useIsAuthenticated };
