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
  // The mode with which the comparison will be running.
  mode: string;
  // The flag indicating whether differences should be printed.
  printDiff: boolean;
}

export enum CompareModes {
  // In this mode, the comparison will fail if there are any changes in the storage layout or in the project.
  STRICT = "strict",
  // In this mode, the comparison will fail only if there are any changes in the storage layout.
  SOFT = "soft",
  // In this mode, the comparison will not fail if there are any changes in the storage layout or in the project.
  NONE = "none",
}
