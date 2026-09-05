// The identity-bar data every screen with an AppHeader needs — bundled
// because these three always travel together (see docs/adr and the
// mattpocock code-review pass that flagged them as a data clump).
export type Viewer = {
  parentName: string;
  studentName: string;
  moeLevel: string;
};
