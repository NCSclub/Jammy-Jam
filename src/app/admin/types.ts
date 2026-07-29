export type Participant = {
  id: string;
  name: string;
  email: string;
  university: string;
  level: string;
  team: string | null;
  teamSize: number | null;
  teamMembers: string[];
  /** "both" | "13" | "14", or null for anyone who registered before we asked */
  attendance: string | null;
  staying: boolean;
  checkedIn: boolean;
};
