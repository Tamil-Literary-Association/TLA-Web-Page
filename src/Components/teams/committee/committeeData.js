// What the committee page is made of. The people and the year are edited at
// /admin/committee and stored in Supabase (supabase/migrations/committee.sql);
// BUILT_IN_COMMITTEE below is only the fallback used when that can't be read
// (the SQL not run yet, or Supabase is down), so the page always shows someone.

// The sections of the page, in this order. The admin can't add sections; to
// add one, add it here and to the group_id check in committee.sql.
//   layout "podium"  – first person (the President) in the middle, raised,
//                      with the next two either side; the rest in a row below
//   layout "cards"   – portrait cards
//   layout "circles" – compact round portraits
export const COMMITTEE_GROUP_DEFS = [
  {
    id: "office-bearers",
    title: "பதவி வகிப்போர்",
    subtitle: "Office bearers",
    layout: "podium",
    help: "President, vice presidents, secretary, vice secretary and treasurer. The FIRST person here is shown in the middle, larger (put the President first). The next two stand either side of them.",
  },
  {
    id: "team-coordinators",
    title: "அணி ஒருங்கிணைப்பாளர்கள்",
    subtitle: "Team coordinators",
    layout: "cards",
    help: "The coordinators of the web, tech, media and design teams. Shown as portrait cards.",
  },
  {
    id: "editors",
    title: "இதழாசிரியர்கள்",
    subtitle: "Editors",
    layout: "cards",
    help: "The editors of the association's magazines. Shown as portrait cards.",
  },
  {
    id: "coordinators",
    title: "ஒருங்கிணைப்பாளர்கள்",
    subtitle: "Coordinators",
    layout: "circles",
    help: "Everyone else on the committee. Shown as round photos with just the name.",
  },
];

export const GROUP_IDS = COMMITTEE_GROUP_DEFS.map((g) => g.id);

// Ready-made roles for the admin's role picker: [Tamil, English, usual group].
export const ROLE_PRESETS = [
  ["தலைவர்", "President", "office-bearers"],
  ["உப தலைவர்", "Vice President", "office-bearers"],
  ["செயலாளர்", "Secretary", "office-bearers"],
  ["உப செயலாளர்", "Vice Secretary", "office-bearers"],
  ["பொருளாளர்", "Treasurer", "office-bearers"],
  ["உப பொருளாளர்", "Vice Treasurer", "office-bearers"],
  ["இணையத்தள ஒருங்கிணைப்பாளர்", "Web Coordinator", "team-coordinators"],
  ["தொழில்நுட்ப அணி ஒருங்கிணைப்பாளர்", "Tech Team Coordinator", "team-coordinators"],
  ["ஊடக அணி ஒருங்கிணைப்பாளர்", "Media Team Coordinator", "team-coordinators"],
  ["வடிவமைப்பு அணி ஒருங்கிணைப்பாளர்", "Design Team Coordinator", "team-coordinators"],
  ["அலங்கார ஒருங்கிணைப்பாளர்", "Decoration Coordinator", "team-coordinators"],
  ["இதழாசிரியர்", "Editor", "editors"],
  ["ஒருங்கிணைப்பாளர்", "Coordinator", "coordinators"],
].map(([role, roleEn, group]) => ({ role, roleEn, group }));

// Which part of a photo stays in view, 0 = top … 100 = bottom. Most photos
// have the face in the top quarter.
export const DEFAULT_FOCUS = 24;

const drive = (id) => `https://drive.google.com/file/d/${id}/view`;
const person = (group_id, name, role, role_en, driveId, sort_order) => ({
  id: `built-in-${group_id}-${sort_order}`,
  group_id,
  name,
  role,
  role_en,
  photo_url: drive(driveId),
  photo_public_id: "",
  photo_focus: DEFAULT_FOCUS,
  sort_order,
  is_visible: true,
});

const COORDINATOR = ["ஒருங்கிணைப்பாளர்", "Coordinator"];

// The 2026/27 committee, from the "TLA Committee 26/27" Drive folder
// (https://drive.google.com/drive/folders/1CV4_rMSYgtOxKtHoyEt8HemAnEhA2bJi).
// committee.sql seeds the database with the same people.
export const BUILT_IN_COMMITTEE = {
  year: "2026/27",
  intro: "",
  members: [
    person("office-bearers", "Yathursanan", "தலைவர்", "President", "15Y9cAKUDvPppNJE09kzOimQpyQh6u7Rw", 0),
    person("office-bearers", "Keerthanan", "உப தலைவர்", "Vice President", "1f_yfdj_mlYSRaM2spG06chfBTvud5jjo", 1),
    person("office-bearers", "Kottesvaran", "உப தலைவர்", "Vice President", "1_cl2LLqeYUVsfoPpdaSPyzhGDmgZTMRN", 2),
    person("office-bearers", "Sivamynthan", "செயலாளர்", "Secretary", "1Qpbqkp8Y881QvEWrt3Yl829du3I-9KIN", 3),
    person("office-bearers", "Sajeevan", "உப செயலாளர்", "Vice Secretary", "1-5HkocEkUS3YpsxMi-nOhAPy1EmEcqIG", 4),
    person("office-bearers", "Anush", "பொருளாளர்", "Treasurer", "1kfTH8znzPJKftNRY_VZ9XMMjc938oXci", 5),
    person("team-coordinators", "Laavanjan", "இணையத்தள ஒருங்கிணைப்பாளர்", "Web Coordinator", "1V8_fXOEYBwAJtB-R4E5w6xJvaGMHGYLC", 0),
    person("team-coordinators", "Mathujan", "தொழில்நுட்ப அணி ஒருங்கிணைப்பாளர்", "Tech Team Coordinator", "1bXynmNajakLaDjza0Vty-f-IAibt-l-C", 1),
    person("team-coordinators", "Lathushikan", "ஊடக அணி ஒருங்கிணைப்பாளர்", "Media Team Coordinator", "1A2Q0spFlxW0Zw4jitGvzwMG6GjbXs8It", 2),
    person("team-coordinators", "Lisorthman", "ஊடக அணி ஒருங்கிணைப்பாளர்", "Media Team Coordinator", "13p4Dn9lme0fqTAhXtIIH9C8c49sNzVY-", 3),
    person("team-coordinators", "Thiruvarankan", "ஊடக அணி ஒருங்கிணைப்பாளர்", "Media Team Coordinator", "11xPz-3jPr7GIymkDSuLfE13Z5FaJIyeA", 4),
    person("team-coordinators", "Melshan", "அலங்கார ஒருங்கிணைப்பாளர்", "Decoration Coordinator", "1W7HuJCHJhUySJhCiMxw0Q9OSbLfdC_h6", 5),
    person("editors", "Abeeth", "இதழாசிரியர்", "Editor", "19O3yiV19XawvdikDhgbTyo4hqMJqtmzy", 0),
    person("editors", "Babenaiyaa", "இதழாசிரியர்", "Editor", "1oKCBgxXI33KC5PZ2Z57qxGj3jWAGuz7d", 1),
    person("editors", "Geethasanchcharan", "இதழாசிரியர்", "Editor", "14984eKiiQR0W2utsBk8jHw25-lV-eyyW", 2),
    ...[
      ["Aadithiyan", "1_vSAIwcGSiZNU-ipbwvTEyRq2mJqH3F3"],
      ["Aathirai", "1dCqGAJvp9tFAceKwSXmCAsTVYztBU_kd"],
      ["Akalishan", "1sjbMKkwAcck-PPbSBCFpDNjj6VtPID5p"],
      ["Donacia", "18qevtBPnT7RHbqUw2M_RwHsiD8ByWLeg"],
      ["Kimathire", "1x-N5C6ls5w5JUCzik3q1q20PJiR_7_-8"],
      ["Kokulakavi", "15v1BN_gIzXPSVQfDKZ5pe3_Ik2q_RJnc"],
      ["Mahindhan", "16ljvK_BUlKSH4srsP_uOYJBezibWhXQs"],
      ["Manoja", "1mQ7-3XzhpqoIvk3yF4lPhGhkL1pQcoZE"],
      ["Najinthan", "1Ucaso7e8sCRDtzjMhppw1wvJ6W_89ViC"],
      ["Paviththiran", "1SkYa8gG1F3Ub_LgVjvw-WIRH4UMzl7aT"],
      ["Sajinthan", "1wTOEpVK0N2bk--bnQcMTz5n9PzXf5-kA"],
      ["Satkunaraj", "1gpSH40ScSEgonTdwTIZbYiaU0UxJfccv"],
      ["Sayanika", "1M9jeI2ddEg9kluOuQH3nMvveiFvnICVW"],
      ["Vakeesan", "1-_mLXlju92wrw6x3mfP8zYhTM5zoAJ_X"],
    ].map(([name, id], i) => person("coordinators", name, ...COORDINATOR, id, i)),
  ],
};
