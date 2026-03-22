export type Role = 'GSN' | 'SMN' | 'HJN' | 'SGN' | 'BJN' | 'JJN' | 'GGN' | 'IWN' | 'GYJN' | 'JDSN' | 'CULTURE' | 'MEMBER';

export type Department = 'MG' | 'WG' | 'YG' | 'SNG' | 'STUDENTS';

export type GAStatus = 'Member' | 'Deacon' | 'Instructor' | 'Evangelist';

export type MemberStatus = 'Active' | 'Exempted' | 'Absentee' | 'Habitual Absentee' | 'LTA' | 'Dropout';

export type AttendanceType = 'physical' | 'online' | 'catchup_spiritual' | 'catchup_online' | 'catchup_friendship' | 'catchup_full' | 'catchup_bb' | 'absent' | 'exempted';

export type ServiceType = 'wed_morning' | 'wed_evening' | 'sun';

export type EvangelismStage = 'bucket' | 'pickup' | 'bb' | 'read_for_centre' | 'centre' | 'passover';

export type ClaimStatus = 'pending' | 'approved' | 'paid';

export type RoleChangeStatus = 'pending' | 'approved' | 'rejected';

export interface Member {
  id: string;
  name: string;
  scj_number: string;
  email: string;
  phone: string;
  telegram_handle: string;
  department: Department;
  cell: string;
  duty_title: Role;
  ga_status: GAStatus;
  is_pastor: boolean;
  status: MemberStatus;
  profile_image_url: string | null;
  exemption_type: string | null;
  exemption_start: string | null;
  exemption_end: string | null;
  created_at: string;
}

export interface MemberDutyHistory {
  id: string;
  member_id: string;
  role: Role;
  department: Department;
  cell: string;
  ministry_id: string | null;
  appointed_date: string;
  ended_date: string | null;
  appointed_by: string;
  approved_by: string;
  reason_for_change: string | null;
  created_at: string;
}

export interface RoleChangeRequest {
  id: string;
  member_id: string;
  requested_by: string;
  current_role: Role;
  proposed_role: Role;
  proposed_department: Department;
  proposed_cell: string;
  proposed_ministry_id: string | null;
  status: RoleChangeStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  member_id: string;
  service_date: string;
  service_type: ServiceType;
  attendance_type: AttendanceType;
}

export interface DailyBreadRecord {
  id: string;
  member_id: string;
  date: string;
  watched: boolean;
  is_flex_day: boolean;
}

export interface EvangelismProspect {
  id: string;
  prospect_name: string;
  linked_member_id: string;
  stage: EvangelismStage;
  stage_entered_date: string;
  department: Department;
}

export interface TestResult {
  id: string;
  member_id: string;
  test_name: string;
  date_written: string;
  score: number;
  pass: boolean;
  rewrite_required: boolean;
  ministry: 'education' | 'theology';
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  created_by: string;
  created_at: string;
  recipient_group: string;
  telegram_sent: boolean;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  member_id: string;
  read_at: string;
}

export interface Ministry {
  id: string;
  name: string;
  abbreviation: string;
  is_active: boolean;
  bjn_member_id: string | null;
}

export interface FinanceClaim {
  id: string;
  submitted_by: string;
  amount: number;
  category: string;
  status: ClaimStatus;
  date_submitted: string;
  notes: string;
}

export interface ConstructionProject {
  id: string;
  name: string;
  status: string;
  start_date: string;
  budget: number;
  actual_spend: number;
}

export interface UserSession {
  memberId: string;
  role: Role;
  name: string;
  department: Department;
  cell: string;
  ministry_id?: string;
}
