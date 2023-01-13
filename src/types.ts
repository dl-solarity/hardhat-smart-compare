export interface DlCompareConfig {
  // Path to the directory where you want to save the storage layout snapshot.
  snapshotPath: string;
  // File name of the snapshot.
  snapshotFileName: string;
}

export interface DlCompareUserConfig {
  snapshotPath?: string;
  snapshotFileName?: string;
}

export interface CompareArgs {
  // Path to the directory where you want to save the storage layout snapshot.
  snapshotPath: string;
  // File name of the snapshot.
  snapshotFileName: string;
}
