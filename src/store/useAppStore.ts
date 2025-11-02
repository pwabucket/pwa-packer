import { create } from "zustand";
import { persist } from "zustand/middleware";
import bcrypt from "bcryptjs";
import type { Account } from "../types";
import { getLocalStorageKeyForAccountPrivateKey } from "../lib/utils";

export type AppStore = {
  /** Accounts */
  accounts: Account[];
  addAccount: (account: Account) => void;
  updateAccount: (account: Account) => void;
  removeAccount: (accountId: string) => void;
  setAccounts: (accounts: Account[]) => void;

  /** Passwords */
  password: string | null; // in-memory only
  passwordHash: string | null; // persisted
  setPassword: (plain: string) => Promise<void>;
  setPasswordHash: (hash: string | null) => void;
  verifyPassword: (input: string) => Promise<boolean>;
  clearPassword: () => void;
  resetPassword: () => void;

  /** Reset App */
  resetApp: () => void;
};

const EXCLUDED_KEYS: (keyof AppStore)[] = ["password"];

const useAppStore = create(
  persist<AppStore>(
    (set, get) => ({
      /** Accounts */
      accounts: [],

      /** Add Account */
      addAccount: (account: Account) => {
        set((state) => ({
          accounts: [...state.accounts, account],
        }));
      },

      /** Update Account */
      updateAccount: (account: Account) => {
        set((state) => ({
          accounts: state.accounts.map((acc) =>
            acc.id === account.id ? account : acc
          ),
        }));
      },

      /** Remove Account */
      removeAccount: (accountId: string) => {
        set((state) => ({
          accounts: state.accounts.filter((acc) => acc.id !== accountId),
        }));
      },

      /** Set Accounts */
      setAccounts: (accounts: Account[]) => {
        set({ accounts });
      },

      /** Passwords */
      passwordHash: null,
      password: null,

      /** Set Password */
      setPassword: async (plain) => {
        const hash = await bcrypt.hash(plain, 10);
        set({
          passwordHash: hash, // persist hash
          password: plain, // keep in memory
        });
      },

      /** Set Password Hash */
      setPasswordHash: (hash: string | null) => {
        set({ passwordHash: hash });
      },

      /** Verify Password */
      verifyPassword: async (input) => {
        const hash = get().passwordHash;
        if (!hash) return false;
        const match = await bcrypt.compare(input, hash);
        if (match) {
          set({ password: input });
        }
        return match;
      },

      /** Clear Password */
      clearPassword: () => {
        set({ password: null });
      },

      /** Reset Password */
      resetPassword: () => {
        set({ passwordHash: null, password: null });
      },

      /** Reset App */
      resetApp: () => {
        /* Clear stored accounts' private keys */
        get().accounts.forEach((account) => {
          localStorage.removeItem(
            getLocalStorageKeyForAccountPrivateKey(account.id)
          );
        });

        /* Reset Store */
        set({ passwordHash: null, password: null, accounts: [] });
      },
    }),
    {
      name: "app-storage",
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) => !EXCLUDED_KEYS.includes(key as keyof AppStore)
          )
        ) as AppStore,
    }
  )
);

export { useAppStore };
