import { useContext } from "react";
import { AccountsContext } from "../contexts/AccountsContext";

const useAccountsContext = () => useContext(AccountsContext);

export { useAccountsContext };
