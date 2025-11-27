import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router";
import { Auth } from "../components/Auth";

/** Welcome Page Component */
const Welcome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from?.pathname || "/dashboard";

  const onSuccessfulLogin = useCallback(() => {
    navigate(fromLocation, { replace: true });
  }, [fromLocation, navigate]);

  return <Auth onSuccessfulLogin={onSuccessfulLogin} />;
};

export { Welcome };
