export type ShiftType = 'MANHA' | 'TARDE' | 'INTEGRAL' | 'NOITE';

export interface School {
  id: string;
  name: string;
  code?: string | null;
  city: string;
  state: string;
  active: boolean;
  _count?: {
    classes?: number;
    students?: number;
    evaluations?: number;
  };
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  name: string;
  gradeYear: string;
  schoolYear: number;
  shift: ShiftType;
  active: boolean;
  school?: School;
  _count?: {
    students?: number;
    evaluations?: number;
  };
}

export interface Student {
  id: string;
  schoolId: string;
  classId: string;
  name: string;
  birthDate?: string | null;
  registrationNumber?: string | null;
  notes?: string | null;
  active: boolean;
  school?: School;
  class?: SchoolClass;
  _count?: {
    evaluations?: number;
  };
}
