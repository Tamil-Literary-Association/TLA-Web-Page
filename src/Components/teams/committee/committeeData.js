// The committee shown at /teams/committee. Photos are Google Drive links from
// the "TLA Committee 26/27" folder; the folder must stay shared as "Anyone with
// the link" or the photos stop loading. For a new committee, change the year
// and replace the members below.

export const COMMITTEE_YEAR = "2026/27";

export const COMMITTEE_DRIVE_FOLDER =
  "https://drive.google.com/drive/folders/1CV4_rMSYgtOxKtHoyEt8HemAnEhA2bJi";

const drive = (id) => `https://drive.google.com/file/d/${id}/view`;

// Each group is one section of the page, in this order. `layout` picks how the
// group is drawn:
//   "podium"  – first person (the President) in the middle, raised, with the
//               next two either side; the rest in a row below
//   "cards"   – portrait cards
//   "circles" – compact round portraits
export const COMMITTEE_GROUPS = [
  {
    id: "office-bearers",
    title: "பதவி வகிப்போர்",
    subtitle: "Office bearers",
    layout: "podium",
    members: [
      { name: "Yathursanan", role: "தலைவர்", roleEn: "President", photo: drive("15Y9cAKUDvPppNJE09kzOimQpyQh6u7Rw") },
      { name: "Keerthanan", role: "உப தலைவர்", roleEn: "Vice President", photo: drive("1f_yfdj_mlYSRaM2spG06chfBTvud5jjo") },
      { name: "Kottesvaran", role: "உப தலைவர்", roleEn: "Vice President", photo: drive("1_cl2LLqeYUVsfoPpdaSPyzhGDmgZTMRN") },
      { name: "Sivamynthan", role: "செயலாளர்", roleEn: "Secretary", photo: drive("1Qpbqkp8Y881QvEWrt3Yl829du3I-9KIN") },
      { name: "Sajeevan", role: "உப செயலாளர்", roleEn: "Vice Secretary", photo: drive("1-5HkocEkUS3YpsxMi-nOhAPy1EmEcqIG") },
      { name: "Anush", role: "பொருளாளர்", roleEn: "Treasurer", photo: drive("1kfTH8znzPJKftNRY_VZ9XMMjc938oXci") },
    ],
  },
  {
    id: "editors",
    title: "இதழாசிரியர்கள்",
    subtitle: "Editors",
    layout: "cards",
    members: [
      { name: "Abeeth", role: "இதழாசிரியர்", roleEn: "Editor", photo: drive("19O3yiV19XawvdikDhgbTyo4hqMJqtmzy") },
      { name: "Babenaiyaa", role: "இதழாசிரியர்", roleEn: "Editor", photo: drive("1oKCBgxXI33KC5PZ2Z57qxGj3jWAGuz7d") },
      { name: "Geethasanchcharan", role: "இதழாசிரியர்", roleEn: "Editor", photo: drive("14984eKiiQR0W2utsBk8jHw25-lV-eyyW") },
    ],
  },
  {
    id: "team-coordinators",
    title: "அணி ஒருங்கிணைப்பாளர்கள்",
    subtitle: "Team coordinators",
    layout: "cards",
    members: [
      { name: "Laavanjan", role: "இணையத்தள ஒருங்கிணைப்பாளர்", roleEn: "Web Coordinator", photo: drive("1V8_fXOEYBwAJtB-R4E5w6xJvaGMHGYLC") },
      { name: "Mathujan", role: "தொழில்நுட்ப அணி ஒருங்கிணைப்பாளர்", roleEn: "Tech Team Coordinator", photo: drive("1bXynmNajakLaDjza0Vty-f-IAibt-l-C") },
      { name: "Lathushikan", role: "ஊடக அணி ஒருங்கிணைப்பாளர்", roleEn: "Media Team Coordinator", photo: drive("1A2Q0spFlxW0Zw4jitGvzwMG6GjbXs8It") },
      { name: "Lisorthman", role: "ஊடக அணி ஒருங்கிணைப்பாளர்", roleEn: "Media Team Coordinator", photo: drive("13p4Dn9lme0fqTAhXtIIH9C8c49sNzVY-") },
      { name: "Thiruvarankan", role: "ஊடக அணி ஒருங்கிணைப்பாளர்", roleEn: "Media Team Coordinator", photo: drive("11xPz-3jPr7GIymkDSuLfE13Z5FaJIyeA") },
      { name: "Melshan", role: "அலங்கார ஒருங்கிணைப்பாளர்", roleEn: "Decoration Coordinator", photo: drive("1W7HuJCHJhUySJhCiMxw0Q9OSbLfdC_h6") },
    ],
  },
  {
    id: "coordinators",
    title: "ஒருங்கிணைப்பாளர்கள்",
    subtitle: "Coordinators",
    layout: "circles",
    members: [
      { name: "Aadithiyan", photo: drive("1_vSAIwcGSiZNU-ipbwvTEyRq2mJqH3F3") },
      { name: "Aathirai", photo: drive("1dCqGAJvp9tFAceKwSXmCAsTVYztBU_kd") },
      { name: "Akalishan", photo: drive("1sjbMKkwAcck-PPbSBCFpDNjj6VtPID5p") },
      { name: "Donacia", photo: drive("18qevtBPnT7RHbqUw2M_RwHsiD8ByWLeg") },
      { name: "Kimathire", photo: drive("1x-N5C6ls5w5JUCzik3q1q20PJiR_7_-8") },
      { name: "Kokulakavi", photo: drive("15v1BN_gIzXPSVQfDKZ5pe3_Ik2q_RJnc") },
      { name: "Mahindhan", photo: drive("16ljvK_BUlKSH4srsP_uOYJBezibWhXQs") },
      { name: "Manoja", photo: drive("1mQ7-3XzhpqoIvk3yF4lPhGhkL1pQcoZE") },
      { name: "Najinthan", photo: drive("1Ucaso7e8sCRDtzjMhppw1wvJ6W_89ViC") },
      { name: "Paviththiran", photo: drive("1SkYa8gG1F3Ub_LgVjvw-WIRH4UMzl7aT") },
      { name: "Sajinthan", photo: drive("1wTOEpVK0N2bk--bnQcMTz5n9PzXf5-kA") },
      { name: "Satkunaraj", photo: drive("1gpSH40ScSEgonTdwTIZbYiaU0UxJfccv") },
      { name: "Sayanika", photo: drive("1M9jeI2ddEg9kluOuQH3nMvveiFvnICVW") },
      { name: "Vakeesan", photo: drive("1-_mLXlju92wrw6x3mfP8zYhTM5zoAJ_X") },
    ].map((m) => ({ ...m, role: "ஒருங்கிணைப்பாளர்", roleEn: "Coordinator" })),
  },
];

export const COMMITTEE_COUNT = COMMITTEE_GROUPS.reduce((n, g) => n + g.members.length, 0);

// Faces for the card on the Teams page: the President in the middle, the other
// office bearers either side.
const [president, ...bearers] = COMMITTEE_GROUPS[0].members;
export const COMMITTEE_PREVIEW = [bearers[2], bearers[0], president, bearers[1], bearers[3]].filter(Boolean);
