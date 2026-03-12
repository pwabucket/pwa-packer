import { useLocation } from "react-router";

export default function useLocationIndex(key?: string) {
  const location = useLocation();
  const stateKey = `__index_${key}`;
  const index: number | undefined = location.state?.[stateKey];

  return index;
}
