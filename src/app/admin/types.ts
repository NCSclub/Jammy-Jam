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
