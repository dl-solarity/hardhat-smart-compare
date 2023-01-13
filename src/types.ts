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
  // Future file name of the snapshot.
  snapshotFileName: string;
  // Path to the directory where the saved storage layout snapshot was saved.
  savedSpName: string;
  // File name of the saved snapshot.
  savedSpPath: string;
}
