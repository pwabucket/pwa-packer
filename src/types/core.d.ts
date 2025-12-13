export interface Account {
  id: string;
  title: string;
  depositAddress: string;
  walletAddress: string;
  url?: string;
}

export interface BackupData {
  version: string;
  timestamp: string;
  data: {
    accounts: Account[];
    passwordHash: string | null;
    privateKeys: {
      accountId: string;
      privateKey: string | null;
    }[];
  };
}

export interface Activity {
  activity: boolean;
  amount: number;
  activityBalance: number;
}
