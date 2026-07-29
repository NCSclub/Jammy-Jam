export type Participant = {
  id: string;
  name: string;
  email: string;
  university: string;
  level: string;
  team: string | null;
  staying: boolean;
  checkedIn: boolean;
};
