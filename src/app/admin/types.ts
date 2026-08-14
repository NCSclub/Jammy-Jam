/**
 * One handed-in game, as the dashboard needs it.
 *
 * A flattened, already-signed view of `listSubmissions()` rather than the row
 * itself: the panel is a client component, so everything it shows has to have
 * survived the trip through the server component — a storage path would be
 * useless there, and the raw row carries several the browser must never see.
 */
export type AdminSubmission = {
  id: string;
  submittedAt: string;
  teamName: string;
  gameTitle: string;
  notes: string | null;
  buildName: string | null;
  buildSize: number | null;
  buildUrl: string | null;
  reportUrl: string | null;
  /** Uploaded (a signed download) rather than a link the team pasted. */
  reportStored: boolean;
  deckUrl: string | null;
  deckStored: boolean;
  otherLinks: string[];
};

export type Participant = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  discord: string | null;
  university: string;
  studentId: string | null;
  level: string;
  skills: string | null;
  expectations: string | null;
  team: string | null;
  teamSize: number | null;
  teamMembers: string[];
  /** "both" | "13" | "14", or null for anyone who registered before we asked */
  attendance: string | null;
  staying: boolean;
  checkedIn: boolean;
};
