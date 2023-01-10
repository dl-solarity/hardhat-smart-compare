export interface DlCompareConfig {
  // Path to the directory where you want to save the storage layout snapshot.
  snapshotPath: string;
}

export interface DlCompareUserConfig {
  snapshotPath?: string;
}

export interface CompareArgs {
  // Path to the directory where you want to save the storage layout snapshot.
  snapshotPath: string;
}
