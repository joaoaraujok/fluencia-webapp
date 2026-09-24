export interface ChildProfile {
  id: string;
  name: string;
  birthDate?: string; // YYYY-MM-DD
  gradeOrAge?: string;
  notes?: string;
  createdAt: number;
}
