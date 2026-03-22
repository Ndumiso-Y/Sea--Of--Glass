import { Member, AttendanceRecord, DailyBreadRecord, EvangelismProspect, TestResult, Announcement, AnnouncementRead, Ministry, FinanceClaim, ConstructionProject, MemberDutyHistory, RoleChangeRequest } from './types';

export const members: Member[] = [
  { id: 'm1', name: 'Thabo Molefe', scj_number: 'SCJ-RSA-001', email: 'thabo@example.com', phone: '+27711234567', telegram_handle: '@thabo_m', department: 'MG', cell: 'MG-A', duty_title: 'GSN', ga_status: 'Evangelist', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-01-15' },
  { id: 'm2', name: 'Sipho Ndlovu', scj_number: 'SCJ-RSA-002', email: 'sipho@example.com', phone: '+27712345678', telegram_handle: '@sipho_n', department: 'MG', cell: 'MG-A', duty_title: 'SMN', ga_status: 'Instructor', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-02-10' },
  { id: 'm3', name: 'David Khumalo', scj_number: 'SCJ-RSA-003', email: 'david@example.com', phone: '+27713456789', telegram_handle: '@david_k', department: 'MG', cell: 'MG-B', duty_title: 'HJN', ga_status: 'Deacon', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-03-05' },
  { id: 'm4', name: 'John Mokoena', scj_number: 'SCJ-RSA-004', email: 'john@example.com', phone: '+27714567890', telegram_handle: '@john_m', department: 'MG', cell: 'MG-B', duty_title: 'GYJN', ga_status: 'Member', is_pastor: true, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-03-20' },
  { id: 'm5', name: 'Naledi Dlamini', scj_number: 'SCJ-RSA-005', email: 'naledi@example.com', phone: '+27715678901', telegram_handle: '@naledi_d', department: 'WG', cell: 'WG-A', duty_title: 'HJN', ga_status: 'Instructor', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-04-01' },
  { id: 'm6', name: 'Lerato Mahlangu', scj_number: 'SCJ-RSA-006', email: 'lerato@example.com', phone: '+27716789012', telegram_handle: '@lerato_m', department: 'WG', cell: 'WG-A', duty_title: 'GYJN', ga_status: 'Member', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-04-15' },
  { id: 'm7', name: 'Palesa Motaung', scj_number: 'SCJ-RSA-007', email: 'palesa@example.com', phone: '+27717890123', telegram_handle: '@palesa_m', department: 'WG', cell: 'WG-B', duty_title: 'SGN', ga_status: 'Deacon', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-05-01' },
  { id: 'm8', name: 'Grace Nkosi', scj_number: 'SCJ-RSA-008', email: 'grace@example.com', phone: '+27718901234', telegram_handle: '@grace_n', department: 'WG', cell: 'WG-B', duty_title: 'MEMBER', ga_status: 'Member', is_pastor: false, status: 'Absentee', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-05-15' },
  { id: 'm9', name: 'Tshepiso Tshabalala', scj_number: 'SCJ-RSA-009', email: 'tshepiso@example.com', phone: '+27719012345', telegram_handle: '@tshepiso_t', department: 'YG', cell: 'YG-A', duty_title: 'HJN', ga_status: 'Member', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-06-01' },
  { id: 'm10', name: 'Mpho Setlhare', scj_number: 'SCJ-RSA-010', email: 'mpho@example.com', phone: '+27710123456', telegram_handle: '@mpho_s', department: 'YG', cell: 'YG-B', duty_title: 'GYJN', ga_status: 'Member', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-06-15' },
  { id: 'm11', name: 'Elizabeth Phiri', scj_number: 'SCJ-RSA-011', email: 'elizabeth@example.com', phone: '+27711122334', telegram_handle: '@liz_p', department: 'SNG', cell: 'SNG-A', duty_title: 'HJN', ga_status: 'Evangelist', is_pastor: false, status: 'Active', profile_image_url: null, exemption_type: null, exemption_start: null, exemption_end: null, created_at: '2023-07-01' },
  { id: 'm12', name: 'Samuel Mthembu', scj_number: 'SCJ-RSA-012', email: 'samuel@example.com', phone: '+27712233445', telegram_handle: '@sam_m', department: 'SNG', cell: 'SNG-B', duty_title: 'MEMBER', ga_status: 'Member', is_pastor: false, status: 'Exempted', profile_image_url: null, exemption_type: 'Medical', exemption_start: '2024-01-01', exemption_end: '2024-06-01', created_at: '2023-07-15' },
];

const serviceTypes: Array<'wed_morning' | 'wed_evening' | 'sun'> = ['wed_morning', 'wed_evening', 'sun'];
const attTypes: Array<'physical' | 'online' | 'absent'> = ['physical', 'online', 'absent'];
const weeks = ['2024-03-04', '2024-03-11', '2024-03-18', '2024-03-25'];

export const attendance: AttendanceRecord[] = [];
let attId = 1;
weeks.forEach(week => {
  members.forEach(m => {
    serviceTypes.forEach(st => {
      const r = Math.random();
      const at = r > 0.7 ? 'absent' : r > 0.3 ? 'physical' : 'online';
      attendance.push({ id: `att-${attId++}`, member_id: m.id, service_date: week, service_type: st, attendance_type: m.status === 'Exempted' ? 'exempted' : at });
    });
  });
});

const dbDays = ['Mon', 'Tue', 'Thu', 'Fri'];
export const dailyBread: DailyBreadRecord[] = [];
let dbId = 1;
weeks.forEach(week => {
  members.forEach(m => {
    dbDays.forEach((_, di) => {
      dailyBread.push({ id: `db-${dbId++}`, member_id: m.id, date: `${week}-d${di}`, watched: Math.random() > 0.3, is_flex_day: false });
    });
  });
});

export const evangelismProspects: EvangelismProspect[] = [
  { id: 'ep1', prospect_name: 'Kagiso Mabena', linked_member_id: 'm4', stage: 'bucket', stage_entered_date: '2024-03-01', department: 'MG' },
  { id: 'ep2', prospect_name: 'Lindiwe Zulu', linked_member_id: 'm6', stage: 'pickup', stage_entered_date: '2024-02-20', department: 'WG' },
  { id: 'ep3', prospect_name: 'Peter Moloi', linked_member_id: 'm3', stage: 'bb', stage_entered_date: '2024-02-15', department: 'MG' },
  { id: 'ep4', prospect_name: 'Nomsa Sithole', linked_member_id: 'm5', stage: 'read_for_centre', stage_entered_date: '2024-02-10', department: 'WG' },
  { id: 'ep5', prospect_name: 'Bongani Langa', linked_member_id: 'm9', stage: 'centre', stage_entered_date: '2024-01-25', department: 'YG' },
  { id: 'ep6', prospect_name: 'Thandiwe Nkomo', linked_member_id: 'm10', stage: 'passover', stage_entered_date: '2024-01-10', department: 'YG' },
  { id: 'ep7', prospect_name: 'James Radebe', linked_member_id: 'm11', stage: 'bb', stage_entered_date: '2024-03-05', department: 'SNG' },
  { id: 'ep8', prospect_name: 'Refilwe Tau', linked_member_id: 'm7', stage: 'pickup', stage_entered_date: '2024-03-10', department: 'WG' },
];

export const testResults: TestResult[] = [
  { id: 'tr1', member_id: 'm3', test_name: 'Level 1 Foundation', date_written: '2024-02-15', score: 88, pass: true, rewrite_required: false, ministry: 'education' },
  { id: 'tr2', member_id: 'm6', test_name: 'Level 1 Foundation', date_written: '2024-02-15', score: 72, pass: true, rewrite_required: false, ministry: 'education' },
  { id: 'tr3', member_id: 'm9', test_name: 'Level 2 Intermediate', date_written: '2024-03-01', score: 45, pass: false, rewrite_required: true, ministry: 'education' },
  { id: 'tr4', member_id: 'm10', test_name: 'Level 1 Foundation', date_written: '2024-03-01', score: 91, pass: true, rewrite_required: false, ministry: 'education' },
  { id: 'tr5', member_id: 'm4', test_name: 'Pre-member Theology Basics', date_written: '2024-02-20', score: 65, pass: true, rewrite_required: false, ministry: 'theology' },
  { id: 'tr6', member_id: 'm12', test_name: 'Level 1 Foundation', date_written: '2024-01-20', score: 55, pass: false, rewrite_required: true, ministry: 'education' },
];

export const announcements: Announcement[] = [
  { id: 'an1', title: 'Sunday Service Time Change', body: 'Please note that Sunday service will now start at 12:00 instead of 10:00 effective from next week.', created_by: 'm1', created_at: '2024-03-20T10:00:00', recipient_group: 'all', telegram_sent: true },
  { id: 'an2', title: 'Youth Group Camp Registration', body: 'Youth camp registration is now open. Please register by March 30th. Contact Tshepiso for details.', created_by: 'm2', created_at: '2024-03-18T14:30:00', recipient_group: 'YG', telegram_sent: true },
  { id: 'an3', title: 'Finance Report Deadline', body: 'All ministry leaders please submit your finance reports by end of March.', created_by: 'm1', created_at: '2024-03-15T09:00:00', recipient_group: 'all', telegram_sent: false },
];

export const announcementReads: AnnouncementRead[] = [
  { id: 'ar1', announcement_id: 'an1', member_id: 'm3', read_at: '2024-03-20T12:00:00' },
  { id: 'ar2', announcement_id: 'an1', member_id: 'm5', read_at: '2024-03-20T13:00:00' },
  { id: 'ar3', announcement_id: 'an1', member_id: 'm6', read_at: '2024-03-21T08:00:00' },
  { id: 'ar4', announcement_id: 'an2', member_id: 'm9', read_at: '2024-03-19T10:00:00' },
  { id: 'ar5', announcement_id: 'an2', member_id: 'm10', read_at: '2024-03-19T11:00:00' },
];

export const ministries: Ministry[] = [
  { id: 'min1', name: 'Planning', abbreviation: 'PLAN', is_active: true, bjn_member_id: 'm3' },
  { id: 'min2', name: 'Finance', abbreviation: 'FIN', is_active: true, bjn_member_id: 'm5' },
  { id: 'min3', name: 'Education', abbreviation: 'EDU', is_active: true, bjn_member_id: 'm9' },
  { id: 'min4', name: 'Theology', abbreviation: 'THEO', is_active: true, bjn_member_id: 'm11' },
  { id: 'min5', name: 'Evangelism', abbreviation: 'EVAN', is_active: true, bjn_member_id: 'm10' },
  { id: 'min6', name: 'Culture', abbreviation: 'CULT', is_active: true, bjn_member_id: 'm7' },
  { id: 'min7', name: 'Domestic Missions (MODM)', abbreviation: 'MODM', is_active: true, bjn_member_id: 'm6' },
  { id: 'min8', name: 'Construction', abbreviation: 'CONST', is_active: true, bjn_member_id: null },
  { id: 'min9', name: 'Admin & General Affairs', abbreviation: 'AGA', is_active: false, bjn_member_id: null },
  { id: 'min10', name: 'Internal Affairs', abbreviation: 'IA', is_active: false, bjn_member_id: null },
  { id: 'min11', name: 'International Missions', abbreviation: 'IM', is_active: false, bjn_member_id: null },
  { id: 'min12', name: 'International Dept', abbreviation: 'ID', is_active: false, bjn_member_id: null },
  { id: 'min13', name: 'ICT', abbreviation: 'ICT', is_active: false, bjn_member_id: null },
  { id: 'min14', name: 'Praise & Worship', abbreviation: 'PW', is_active: false, bjn_member_id: null },
  { id: 'min15', name: 'Liaison', abbreviation: 'LIA', is_active: false, bjn_member_id: null },
  { id: 'min16', name: 'Publicity', abbreviation: 'PUB', is_active: false, bjn_member_id: null },
  { id: 'min17', name: 'Judicial Affairs', abbreviation: 'JUD', is_active: false, bjn_member_id: null },
  { id: 'min18', name: 'Auditing', abbreviation: 'AUD', is_active: false, bjn_member_id: null },
  { id: 'min19', name: 'Sports', abbreviation: 'SPT', is_active: false, bjn_member_id: null },
  { id: 'min20', name: 'Enterprise', abbreviation: 'ENT', is_active: false, bjn_member_id: null },
  { id: 'min21', name: 'Health & Welfare', abbreviation: 'HW', is_active: false, bjn_member_id: null },
  { id: 'min22', name: 'Service & Transportation', abbreviation: 'ST', is_active: false, bjn_member_id: null },
  { id: 'min23', name: 'Diplomatic Policy', abbreviation: 'DP', is_active: false, bjn_member_id: null },
  { id: 'min24', name: 'Publishing', abbreviation: 'PUBL', is_active: false, bjn_member_id: null },
];

export const financeClaims: FinanceClaim[] = [
  { id: 'fc1', submitted_by: 'm5', amount: 1500, category: 'Transport', status: 'approved', date_submitted: '2024-03-10', notes: 'Bus hire for event' },
  { id: 'fc2', submitted_by: 'm3', amount: 800, category: 'Supplies', status: 'pending', date_submitted: '2024-03-15', notes: 'Stationery for education dept' },
  { id: 'fc3', submitted_by: 'm9', amount: 3200, category: 'Catering', status: 'paid', date_submitted: '2024-03-05', notes: 'Youth camp food' },
];

export const constructionProjects: ConstructionProject[] = [
  { id: 'cp1', name: 'Church Hall Extension', status: 'In Progress', start_date: '2024-01-15', budget: 250000, actual_spend: 175000 },
  { id: 'cp2', name: 'Parking Lot Upgrade', status: 'Planning', start_date: '2024-04-01', budget: 80000, actual_spend: 0 },
];

export const dutyHistory: MemberDutyHistory[] = [
  { id: 'dh1', member_id: 'm1', role: 'GSN', department: 'MG', cell: 'MG-A', ministry_id: null, appointed_date: '2023-01-15', ended_date: null, appointed_by: 'm1', approved_by: 'm1', reason_for_change: 'Church establishment', created_at: '2023-01-15' },
  { id: 'dh2', member_id: 'm2', role: 'SMN', department: 'MG', cell: 'MG-A', ministry_id: null, appointed_date: '2023-02-10', ended_date: null, appointed_by: 'm1', approved_by: 'm1', reason_for_change: 'Appointed as secretary', created_at: '2023-02-10' },
  { id: 'dh3', member_id: 'm3', role: 'MEMBER', department: 'MG', cell: 'MG-B', ministry_id: null, appointed_date: '2023-03-05', ended_date: '2023-08-01', appointed_by: 'm2', approved_by: 'm1', reason_for_change: 'Initial joining', created_at: '2023-03-05' },
  { id: 'dh4', member_id: 'm3', role: 'HJN', department: 'MG', cell: 'MG-B', ministry_id: 'min1', appointed_date: '2023-08-01', ended_date: null, appointed_by: 'm2', approved_by: 'm1', reason_for_change: 'Promoted to department leader', created_at: '2023-08-01' },
];

export const roleChangeRequests: RoleChangeRequest[] = [
  { id: 'rcr1', member_id: 'm8', requested_by: 'm2', current_role: 'MEMBER', proposed_role: 'GYJN', proposed_department: 'WG', proposed_cell: 'WG-B', proposed_ministry_id: null, status: 'pending', reviewed_by: null, reviewed_at: null, rejection_reason: null, created_at: '2024-03-18' },
];

export const loginCredentials: Array<{ email: string; password: string; memberId: string }> = [
  { email: 'thabo@example.com', password: 'admin123', memberId: 'm1' },
  { email: 'sipho@example.com', password: 'admin123', memberId: 'm2' },
  { email: 'david@example.com', password: 'admin123', memberId: 'm3' },
  { email: 'naledi@example.com', password: 'admin123', memberId: 'm5' },
  { email: 'lerato@example.com', password: 'admin123', memberId: 'm6' },
  { email: 'tshepiso@example.com', password: 'admin123', memberId: 'm9' },
  { email: 'grace@example.com', password: 'admin123', memberId: 'm8' },
];
