import { useEffect } from "react";
import { useLocation } from "react-router";
import ReactGA from "react-ga4";

const useAnalytics = () => {
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    ReactGA.send({
      hitType: "pageview",
      page: pathname,
      title: document.title,
    });
  }, [pathname]);
};

export { useAnalytics };
