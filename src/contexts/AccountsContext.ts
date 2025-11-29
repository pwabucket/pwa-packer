import { createContext } from "react";
import type { Account } from "../types";

interface AccountsContextType {
  group: string;
  accounts: Account[];
}

const AccountsContext = createContext<AccountsContextType>({
  group: "",
  accounts: [],
});
export { AccountsContext };
