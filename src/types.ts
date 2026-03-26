export type Role = 'student' | 'faculty';

export interface Student {
  id: string; // This will act as the 12-digit numeric username
  name: string;
  dob: string; // Date of birth (DD/MM/YYYY) for password
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  course: string;
  year: string;
  email: string;
  phone: string;
  city: string;
  subjects?: string[];
  attendance?: AttendanceRecord[];
  fees?: FeeRecord;
  results?: ResultRecord[];
}

export interface AttendanceRecord {
  date: string;
  status: 'Present' | 'Absent' | 'Late';
}

export interface FeeRecord {
  total: number;
  paid: number;
  balance: number;
  history: { date: string; amount: number; method: string }[];
}

export interface ResultRecord {
  subject: string;
  marks: number;
  total: number;
  grade: string;
  semester: string;
}

export interface TimetableEntry {
  day: string;
  slots: { time: string; subject: string; room: string; faculty: string }[];
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  grade?: string;
  description?: string;
  instructions?: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'info' | 'warning' | 'success';
}
