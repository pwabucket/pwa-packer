import { useCallback, useMemo } from "react";
import { type NavigateOptions } from "react-router";
import useLocationState from "./useLocationState";

export default function useLocationToggle(
  key: string,
  indexKey?: string,
): [boolean, (status: boolean, options?: NavigateOptions) => void] {
  const [show, setShow] = useLocationState(key, false, indexKey);

  /** Toggle Location */
  const toggle = useCallback(
    (status: boolean, options?: NavigateOptions) => {
      if (status) {
        setShow(true, options);
      } else {
        setShow(undefined);
      }
    },
    [key, setShow],
  );

  return useMemo(() => [show, toggle], [show, toggle]);
}
