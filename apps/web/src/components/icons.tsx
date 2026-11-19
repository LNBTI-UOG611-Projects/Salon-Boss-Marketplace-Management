/**
 * BOSSONE icon set: hand-drawn line icons with a soft duotone fill and the four-point
 * sparkle from the logo. Drop-in replacement for Material Symbols: <Icon name="search" />.
 * Sizes follow the font size (text-[16px] etc.), colours follow the text colour.
 * Unknown names show the brand sparkle, so new category icons never break the page.
 */

type Glyph = { s: string[]; f?: string[]; d?: string[]; t?: string[] };

/* Shape helpers (24 x 24 grid). */
const C = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const R = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${h - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${-(w - 2 * r)}a${r} ${r} 0 0 1 ${-r} ${-r}v${-(h - 2 * r)}a${r} ${r} 0 0 1 ${r} ${-r}z`;
/** Four-point sparkle (the star in the logo). */
const SP = (cx: number, cy: number, s: number) =>
  `M${cx} ${cy - s}Q${cx} ${cy} ${cx + s} ${cy}Q${cx} ${cy} ${cx} ${cy + s}Q${cx} ${cy} ${cx - s} ${cy}Q${cx} ${cy} ${cx} ${cy - s}z`;
/** Scalloped seal used by "verified". */
const SEAL = (() => {
  const n = 9, r = 7.6, b = 3.1;
  const pt = (i: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return `${(12 + r * Math.cos(a)).toFixed(2)} ${(12 + r * Math.sin(a)).toFixed(2)}`;
  };
  let d = `M${pt(0)}`;
  for (let i = 1; i <= n; i++) d += `A${b} ${b} 0 0 1 ${pt(i)}`;
  return d + 'z';
})();
const DOC = 'M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8z';
const FOLD = 'M14 3.5V8h4.5';
const BOX_LID = 'M3.5 4.5h17v4h-17z';
const BOX = 'M5 8.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19V8.5';
const SHIELD = 'M12 3.5 19 6v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z';
const PIN = 'M12 21s-6.5-6.1-6.5-11.5a6.5 6.5 0 0 1 13 0C18.5 14.9 12 21 12 21z';
const BUBBLE = 'M4.5 6.5A2.5 2.5 0 0 1 7 4h10a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 17 16h-6l-4.5 4v-4H7a2.5 2.5 0 0 1-2.5-2.5z';
const EYE = 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z';
const HEART = 'M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z';
const AWNING = 'M4 9.5 5.5 4.5h13L20 9.5';
const SCALLOP = 'M4 9.5a2.67 2.67 0 0 0 5.33 0a2.67 2.67 0 0 0 5.34 0a2.67 2.67 0 0 0 5.33 0';
const LOCK_BODY = R(5, 10.5, 14, 10, 2.5);
const TRASH = 'M6.5 6.5l.9 12.6A1.5 1.5 0 0 0 8.9 20.5h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-12.6';
const TRAY = 'M4.5 16.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5';
const CHECK_SM = 'M8.8 12.2l2.2 2.2 4.2-4.4';
const SLASH = 'M4 4l16 16';
const RING = C(12, 12, 8.5);
const wave = (y: number) => `M3 ${y}c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0`;

const GLYPHS: Record<string, Glyph> = {
  sparkle: { s: [SP(12, 12, 8)], f: [SP(12, 12, 8)], d: [SP(18.5, 5, 2.2)] },

  /* Orders, payment and sharing (Section C) */
  zoom_in: { s: [C(10.5, 10.5, 6), 'M15 15l5 5', 'M10.5 8v5', 'M8 10.5h5'], f: [C(10.5, 10.5, 6)] },
  share: { s: [C(17.5, 5.5, 2.5), C(6.5, 12, 2.5), C(17.5, 18.5, 2.5), 'M8.7 10.8l6.6-4', 'M8.7 13.2l6.6 4'], f: [C(17.5, 5.5, 2.5), C(6.5, 12, 2.5), C(17.5, 18.5, 2.5)] },
  schedule: { s: [RING, 'M12 7.5V12l3 2'], f: [RING] },
  content_copy: { s: [R(8.5, 8.5, 11, 12, 2), 'M15.5 8.5V5.5A1.5 1.5 0 0 0 14 4H6A1.5 1.5 0 0 0 4.5 5.5V15A1.5 1.5 0 0 0 6 16.5h2.5'], f: [R(8.5, 8.5, 11, 12, 2)] },
  credit_card: { s: [R(3, 5.5, 18, 13, 2.5), 'M3 10h18', 'M6.5 14.5h4'], f: ['M3 7.5A2 2 0 0 1 5 5.5h14a2 2 0 0 1 2 2V10H3z'] },
  payments: { s: [R(2.5, 6.5, 19, 11, 2), C(12, 12, 2.6), 'M5.5 9.5v5', 'M18.5 9.5v5'], f: [R(2.5, 6.5, 19, 11, 2)], d: [C(12, 12, 1)] },
  account_balance: { s: ['M3.5 9 12 4.5 20.5 9z', 'M5.5 9.5v7', 'M10 9.5v7', 'M14 9.5v7', 'M18.5 9.5v7', 'M3.5 19.5h17'], f: ['M3.5 9 12 4.5 20.5 9z'] },
  print: { s: ['M7 8.5V4.5h10v4', R(3.5, 8.5, 17, 8, 2), 'M7 14h10v6H7z'], f: [R(3.5, 8.5, 17, 8, 2)], d: [C(17, 11.5, 0.9)] },
  cancel: { s: [RING, 'M9 9l6 6', 'M15 9l-6 6'], f: [RING] },
  map: { s: ['M3.5 6.5 9 4.5l6 2 5.5-2v13l-5.5 2-6-2-5.5 2z', 'M9 4.5v13', 'M15 6.5v13'], f: ['M9 4.5l6 2v13l-6-2z'] },
  remove_shopping_cart: { s: ['M3 4.5h2.5l2 10.5h10l2-7.5H7', C(9, 19, 1.4), C(17, 19, 1.4), SLASH], f: ['M7 7.5h12.5l-2 7.5h-10z'] },
  inventory: { s: [R(4, 4, 16, 16, 2.5), 'M8 9.5h8', 'M8 13h8', 'M8 16.5h5'], f: [R(4, 4, 16, 16, 2.5)] },
  bookmark: { s: ['M7 3.5h10a1 1 0 0 1 1 1v16l-6-4-6 4v-16a1 1 0 0 1 1-1z'], f: ['M7 3.5h10a1 1 0 0 1 1 1v16l-6-4-6 4v-16a1 1 0 0 1 1-1z'] },
  history: { s: ['M4.5 12a7.5 7.5 0 1 0 2.2-5.3', 'M4.5 4v3.5H8', 'M12 8v4.5l3 1.8'], f: [] },

  /* Navigation */
  arrow_forward: { s: ['M6.5 12h12.5', 'M14 7l5 5-5 5'], d: [C(3.8, 12, 1.15)] },
  arrow_back: { s: ['M17.5 12H5', 'M10 7l-5 5 5 5'], d: [C(20.2, 12, 1.15)] },
  chevron_right: { s: ['M9.5 6l6 6-6 6'] },
  chevron_left: { s: ['M14.5 6l-6 6 6 6'] },
  expand_more: { s: ['M6 9.5l6 6 6-6'] },
  close: { s: ['M6.5 6.5l11 11', 'M17.5 6.5l-11 11'] },
  remove: { s: ['M5 12h14'] },
  compare_arrows: { s: ['M4 8.5h13', 'M13.5 5 17 8.5 13.5 12', 'M20 15.5H7', 'M10.5 12 7 15.5l3.5 3.5'] },
  notifications_active: { s: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z', 'M10 20.5a2.2 2.2 0 0 0 4 0', 'M3 8.5a8.5 8.5 0 0 1 2.5-4.5', 'M21 8.5a8.5 8.5 0 0 0-2.5-4.5'], f: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z'] },
  military_tech: { s: ['M8 3.5 12 10l4-6.5', 'M5 3.5h4l3 5 3-5h4', C(12, 15.5, 5), 'M12 12.8l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3z'], f: [C(12, 15.5, 5)] },
  done: { s: ['M5 12.5l4.5 4.5L19 7.5'] },
  more_vert: { s: [C(12, 5.5, 1.1), C(12, 12, 1.1), C(12, 18.5, 1.1)], f: [C(12, 5.5, 1.1), C(12, 12, 1.1), C(12, 18.5, 1.1)] },
  arrow_downward: { s: ['M12 4.5v14', 'M7 14l5 5 5-5'] },
  swap_vert: { s: ['M8 19V5', 'M4.5 8.5 8 5l3.5 3.5', 'M16 5v14', 'M12.5 15.5 16 19l3.5-3.5'] },
  key: { s: [C(8, 15, 3.8), 'M10.8 12.3 19.5 3.5', 'M16 7l2.5 2.5', 'M14 9l1.8 1.8'], f: [C(8, 15, 3.8)] },
  flag: { s: ['M5.5 21V4', 'M5.5 4.5h11l-2 4 2 4h-11'], f: ['M5.5 4.5h11l-2 4 2 4h-11z'] },
  description: { s: [DOC, FOLD, 'M8.5 12.5h7', 'M8.5 16h5'], f: [DOC] },
  edit_note: { s: ['M4 6.5h9', 'M4 11h6', 'M4 15.5h4', 'M12.5 19.5l.6-2.8 6-6a1.5 1.5 0 0 1 2.1 2.1l-6 6z'], f: ['M13.1 16.7l6-6a1.5 1.5 0 0 1 2.1 2.1l-6 6-2.7.7z'] },
  contact_phone: { s: [R(3, 5, 18, 14, 2.5), C(9, 11, 2), 'M5.8 16.5a3.4 3.4 0 0 1 6.4 0', 'M14.5 10h3.5', 'M14.5 13.5h3.5'], f: [R(3, 5, 18, 14, 2.5)] },
  domain: { s: ['M4 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v15.5', 'M14 9.5h4.5A1.5 1.5 0 0 1 20 11v9.5', 'M2.5 20.5h19', 'M7.5 7.5h3', 'M7.5 11h3', 'M7.5 14.5h3', 'M16.5 13.5h1', 'M16.5 16.5h1'], f: ['M4 20.5V5a1.5 1.5 0 0 1 1.5-1.5h7A1.5 1.5 0 0 1 14 5v15.5z'] },
  menu: { s: ['M4 7h16', 'M8.5 12H20', 'M4 17h16'], d: [C(4.6, 12, 1.1)] },
  add: { s: ['M12 5v14', 'M5 12h14'] },
  check: { s: ['M5 12.5l4.5 4.5L19 7.5'] },
  home: { s: ['M3.5 11 12 4l8.5 7', 'M5.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5V9.5', 'M10 20.5V16a2 2 0 0 1 4 0v4.5'], f: ['M5.5 9.5 12 4.3l6.5 5.2v11h-13z'] },
  login: { s: ['M10 4.5h7.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H10', 'M4 12h10', 'M10.5 8.5 14 12l-3.5 3.5'], f: ['M13 4.5h4.5A1.5 1.5 0 0 1 19 6v12a1.5 1.5 0 0 1-1.5 1.5H13z'] },
  person_add: { s: [C(10, 8, 3.6), 'M3 20.5c.8-4 3.6-6 7-6 1.6 0 3 .4 4.2 1.2', 'M18.5 13.5v6', 'M15.5 16.5h6'], f: [C(10, 8, 3.6)] },
  logout: { s: ['M14 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5H14', 'M10 12h10', 'M16.5 8.5 20 12l-3.5 3.5'] },

  /* Search & filters */
  search: { s: [C(10.5, 10.5, 6), 'M15 15l5 5', 'M7.8 9.2a3.2 3.2 0 0 1 2.4-1.9'], f: [C(10.5, 10.5, 6)] },
  search_off: { s: [C(10.5, 10.5, 6), 'M15 15l5 5', 'M8.5 8.5l4 4', 'M12.5 8.5l-4 4'], f: [C(10.5, 10.5, 6)] },
  travel_explore: { s: [C(10.5, 10.5, 6.5), 'M4 10.5h13', 'M10.5 4c-2.2 2-2.2 11 0 13', 'M10.5 4c2.2 2 2.2 11 0 13', 'M15.5 15.5 20 20'], f: [C(10.5, 10.5, 6.5)] },
  public: { s: [RING, 'M3.5 12h17', 'M12 3.5c-3 2.5-3 14.5 0 17', 'M12 3.5c3 2.5 3 14.5 0 17'], f: [RING] },
  filter_list: { s: ['M4 7h16', 'M7 12h10', 'M10 17h4'] },
  filter_alt_off: { s: ['M4 5h16l-6 7.5V19l-4 1.5v-8z', 'M3.5 3.5l17 17'], f: ['M4 5h16l-6 7.5V19l-4 1.5v-8z'] },
  my_location: { s: [C(12, 12, 6.5), 'M12 2.5v3', 'M12 18.5v3', 'M2.5 12h3', 'M18.5 12h3'], d: [C(12, 12, 2.2)] },

  /* Shop */
  shopping_bag: { s: [R(4.5, 7.5, 15, 13, 2.5), 'M8.5 10V7a3.5 3.5 0 0 1 7 0v3'], f: [R(4.5, 7.5, 15, 13, 2.5)], d: [SP(12, 14.5, 2.4)] },
  add_shopping_cart: { s: ['M3 4.5h2.3l2.2 10.5h10.2l2.1-7.5H6.4', C(9, 19, 1.4), C(16.5, 19, 1.4), 'M13 9v3.5', 'M11.25 10.75h3.5'], f: ['M6.4 7.5h13.4l-2.1 7.5H7.5z'] },
  favorite: { s: [HEART], f: [HEART] },
  storefront: { s: [AWNING, SCALLOP, 'M5.5 12.5V20h13v-7.5', 'M10 20v-4.5h4V20'], f: ['M4 9.5 5.5 4.5h13L20 9.5z'] },
  warehouse: { s: ['M3 9.5 12 4l9 5.5V20', 'M3 9.5V20', 'M7 20v-7h10v7', 'M7 15.5h10', 'M7 18h10'], f: ['M3 9.5 12 4l9 5.5z'] },
  local_shipping: { s: ['M3 6.5h10.5v10H3z', 'M13.5 9.5h4l3 3.5v3.5h-7', C(7, 17.5, 1.8), C(17, 17.5, 1.8)], f: ['M3 6.5h10.5v10H3z'] },
  pallet: { s: [R(4, 5, 7, 7, 1.2), R(13, 5, 7, 7, 1.2), 'M2.5 15h19', 'M4 15v4', 'M12 15v4', 'M20 15v4', 'M2.5 19h19'], f: [R(4, 5, 7, 7, 1.2)] },
  inventory_2: { s: [BOX_LID, BOX, 'M10 12.5h4'], f: [BOX_LID] },
  archive: { s: [BOX_LID, BOX, 'M12 11.5v6', 'M9.5 15l2.5 2.5 2.5-2.5'], f: [BOX_LID] },
  unarchive: { s: [BOX_LID, BOX, 'M12 17.5v-6', 'M9.5 14l2.5-2.5 2.5 2.5'], f: [BOX_LID] },
  label: { s: ['M3.5 12.2V5A1.5 1.5 0 0 1 5 3.5h7.2l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0z'], f: ['M3.5 12.2V5A1.5 1.5 0 0 1 5 3.5h7.2l8.3 8.3a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0z'], d: [C(8, 8, 1.5)] },
  receipt_long: { s: ['M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z', 'M9 8h6', 'M9 11.5h6', 'M9 15h3.5'], f: ['M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z'] },
  request_quote: { s: [DOC, FOLD, 'M9 12.5h6', 'M9 16h3.5'], f: ['M14 3.5V8h4.5z'], d: [SP(16, 16, 1.8)] },
  fact_check: { s: [DOC, FOLD, 'M9 14l2 2 4-4'], f: ['M14 3.5V8h4.5z'] },
  picture_as_pdf: { s: [DOC, FOLD, 'M9 12.5h6', 'M9 15.5h6', 'M9 18.5h3'], f: [DOC] },
  upload_file: { s: [DOC, FOLD, 'M12 17.5v-6', 'M9.5 14l2.5-2.5 2.5 2.5'], f: ['M14 3.5V8h4.5z'] },
  file_download: { s: [DOC, FOLD, 'M12 11.5v6', 'M9.5 15l2.5 2.5 2.5-2.5'], f: ['M14 3.5V8h4.5z'] },
  download: { s: ['M12 4v11', 'M7.5 10.5 12 15l4.5-4.5', TRAY] },
  upload: { s: ['M12 15V4', 'M7.5 8.5 12 4l4.5 4.5', TRAY] },

  /* Layout */
  category: { s: [C(7.5, 7.5, 3.5), 'M16.5 4l4 7h-8z', R(4, 13.5, 7, 7, 1.5), C(16.5, 17, 3.5)], f: ['M16.5 4l4 7h-8z'] },
  grid_view: { s: [R(4, 4, 7, 7, 2), R(13, 4, 7, 7, 2), R(4, 13, 7, 7, 2), R(13, 13, 7, 7, 2)], f: [R(4, 4, 7, 7, 2)] },
  apps: { s: [], d: [5, 12, 19].flatMap((y) => [5, 12, 19].map((x) => C(x, y, 1.5))) },
  trending_up: { s: ['M3.5 17.5 9.5 11.5l4 4 7-7.5', 'M15 8h5.5v5.5'] },
  insights: { s: ['M4 20.5h16', R(5.5, 12, 3, 6.5, 0.8), R(10.5, 7, 3, 11.5, 0.8), R(15.5, 10, 3, 8.5, 0.8)], f: [R(10.5, 7, 3, 11.5, 0.8)] },
  gavel: { s: ['M13.5 4.5l6 6', 'M11 7l6 6', 'M12.3 5.7l-4.6 4.6', 'M18.3 11.7l-4.6 4.6', 'M10 12 4.5 17.5a1.4 1.4 0 0 0 2 2L12 14', 'M13 20.5h7.5'] },
  settings: { s: [C(12, 12, 3), 'M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6', C(12, 12, 6.3)] },
  push_pin: { s: ['M9 4.5h6', 'M10 4.5v5L7 13h10l-3-3.5v-5', 'M12 13v7'], f: ['M10 4.5h4v5l3 3.5H7l3-3.5z'] },
  groups: { s: [C(9, 9, 3), 'M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5', C(16.5, 8, 2.4), 'M15.5 13.6c2.5-.4 4.6 1.2 5 4.4'] },
  dashboard: { s: [R(4, 4, 7, 9, 1.5), R(13, 4, 7, 5, 1.5), R(4, 15, 7, 5, 1.5), R(13, 11, 7, 9, 1.5)], f: [R(4, 4, 7, 9, 1.5)] },
  layers: { s: ['M12 4 3.5 8.5 12 13l8.5-4.5z', 'M3.5 12.5 12 17l8.5-4.5', 'M3.5 16.5 12 21l8.5-4.5'], f: ['M12 4 3.5 8.5 12 13l8.5-4.5z'] },
  image: { s: [R(3.5, 4.5, 17, 15, 2.5), 'M3.5 16l5-5 4.5 4.5 2.5-2.5 5 5'], d: [C(15.5, 9, 1.6)], f: ['M3.5 16l5-5 4.5 4.5 2.5-2.5 5 5V17a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 17z'] },
  photo_camera: { s: ['M4.5 7.5h3l1.5-2.5h6l1.5 2.5h3A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5V9a1.5 1.5 0 0 1 1.5-1.5z', C(12, 13.5, 3.5)], f: [C(12, 13.5, 3.5)] },

  /* People & contact */
  person: { s: [C(12, 8, 3.8), 'M4.5 20.5c.8-4 3.8-6 7.5-6s6.7 2 7.5 6'], f: [C(12, 8, 3.8)] },
  face: { s: [RING, 'M9 14.5c1.6 1.6 4.4 1.6 6 0'], d: [C(9.2, 10.3, 1), C(14.8, 10.3, 1)], f: [RING] },
  badge: { s: [R(3.5, 6, 17, 13, 2.5), C(9, 12, 2), 'M6 16.5c.6-1.3 1.7-2 3-2s2.4.7 3 2', 'M14.5 11h3.5', 'M14.5 14h2.5', 'M10 6V4.5h4V6'], f: [C(9, 12, 2)] },
  support_agent: { s: ['M5 13v-1.5a7 7 0 0 1 14 0V13', R(3.5, 12.5, 3.5, 5, 1.5), R(17, 12.5, 3.5, 5, 1.5), 'M18.8 17.5c0 2-2 3-4.5 3H12'], f: [R(3.5, 12.5, 3.5, 5, 1.5), R(17, 12.5, 3.5, 5, 1.5)] },
  contact_support: { s: [BUBBLE, 'M10 8.6a2 2 0 1 1 2.7 1.9c-.5.2-.7.6-.7 1.1'], d: [C(12, 13.4, 0.9)], f: [BUBBLE] },
  sms: { s: [BUBBLE], d: [C(8.5, 10, 0.95), C(12, 10, 0.95), C(15.5, 10, 0.95)], f: [BUBBLE] },
  chat: { s: [BUBBLE, 'M8 9.5h8', 'M8 12.5h5'], f: [BUBBLE] },
  forum: { s: ['M3.5 5.5A1.5 1.5 0 0 1 5 4h9a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 14 13H8l-3.5 3z', 'M18 8.5h1A1.5 1.5 0 0 1 20.5 10v9.5l-3-2.5H11a1.5 1.5 0 0 1-1.5-1.5V15'], f: ['M3.5 5.5A1.5 1.5 0 0 1 5 4h9a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 14 13H8l-3.5 3z'] },
  attach_file: { s: ['M16.5 7.5v8a4.5 4.5 0 0 1-9 0V6.5a3 3 0 0 1 6 0v8.5a1.5 1.5 0 0 1-3 0V7.5'] },
  tune: { s: ['M4 7h9', 'M17 7h3', 'M4 17h3', 'M11 17h9', C(15, 7, 2), C(9, 17, 2)], f: [C(15, 7, 2), C(9, 17, 2)] },
  info: { s: [C(12, 12, 8.5), 'M12 11v5', 'M12 8h.01'], f: [C(12, 12, 8.5)] },
  help: { s: [C(12, 12, 8.5), 'M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4', 'M12 16.8h.01'], f: [C(12, 12, 8.5)] },
  open_in_new: { s: ['M13.5 4.5h6v6', 'M19.5 4.5 11 13', 'M17.5 13.5v4.5a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 18V8A1.5 1.5 0 0 1 6 6.5h4.5'] },
  calendar_month: { s: [R(4, 5.5, 16, 14.5, 2), 'M4 10h16', 'M8.5 3.5v4', 'M15.5 3.5v4'], d: [C(8.5, 14, 0.9), C(12, 14, 0.9), C(15.5, 14, 0.9)], f: [R(4, 5.5, 16, 14.5, 2)] },
  replay: { s: ['M4.5 12a7.5 7.5 0 1 0 2.2-5.3', 'M4.5 4.5v4h4'] },
  mark_chat_read: { s: [BUBBLE, 'M8.5 10.5l2.3 2.3 4.7-4.6'], f: [BUBBLE] },
  mail: { s: [R(3.5, 5.5, 17, 13, 2.5), 'M4.5 7.5l7.5 5.5 7.5-5.5'], f: [R(3.5, 5.5, 17, 13, 2.5)] },
  call: { s: ['M8.6 4.5H6A1.5 1.5 0 0 0 4.5 6c0 7.5 6 13.5 13.5 13.5a1.5 1.5 0 0 0 1.5-1.5v-2.6l-3.6-1.4-1.8 1.8a10 10 0 0 1-4.9-4.9l1.8-1.8z'], f: ['M8.6 4.5H6A1.5 1.5 0 0 0 4.5 6c0 7.5 6 13.5 13.5 13.5a1.5 1.5 0 0 0 1.5-1.5v-2.6l-3.6-1.4-1.8 1.8a10 10 0 0 1-4.9-4.9l1.8-1.8z'] },
  smartphone: { s: [R(6.5, 3, 11, 18, 2.5), 'M10.5 6h3'], d: [C(12, 18, 0.9)], f: [R(6.5, 3, 11, 18, 2.5)] },
  devices: { s: ['M4 15.5V6.5A1.5 1.5 0 0 1 5.5 5h11A1.5 1.5 0 0 1 18 6.5V8', 'M2.5 18.5h10.5', R(15, 10, 6, 10.5, 1.5)], f: [R(15, 10, 6, 10.5, 1.5)] },
  send: { s: ['M4 4.5 20.5 12 4 19.5l2.5-7.5z', 'M6.5 12h6'], f: ['M4 4.5 20.5 12 4 19.5l2.5-7.5z'] },
  notifications: { s: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z', 'M10 20.5a2 2 0 0 0 4 0'], f: ['M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z'] },
  location_on: { s: [PIN, C(12, 9.5, 2.3)], f: [PIN] },
  location_off: { s: [PIN, SLASH], f: [PIN] },

  /* Trust & status */
  verified: { s: [SEAL, CHECK_SM], f: [SEAL] },
  verified_user: { s: [SHIELD, CHECK_SM], f: [SHIELD] },
  shield: { s: [SHIELD], f: [SHIELD], d: [SP(12, 11.5, 3)] },
  shield_person: { s: [SHIELD, C(12, 10.5, 2), 'M8.5 16.5c.8-1.4 2-2.1 3.5-2.1s2.7.7 3.5 2.1'], f: [SHIELD] },
  workspace_premium: { s: [C(12, 9.5, 5.5), 'M8.5 13.8 7 20.5l5-2.5 5 2.5-1.5-6.7'], f: [C(12, 9.5, 5.5)], d: [SP(12, 9.5, 2.7)] },
  star: { s: ['M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z'], f: ['M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z'] },
  bolt: { s: ['M13.5 3 5.5 13.5h6l-1 7.5 8-10.5h-6z'], f: ['M13.5 3 5.5 13.5h6l-1 7.5 8-10.5h-6z'] },
  check_circle: { s: [RING, CHECK_SM], f: [RING] },
  radio_button_unchecked: { s: [RING] },
  error: { s: [RING, 'M12 7.5V13'], d: [C(12, 16.2, 1)], f: [RING] },
  block: { s: [RING, 'M6 6l12 12'] },
  progress_activity: { s: ['M12 3.5a8.5 8.5 0 1 0 8.5 8.5'], t: [RING] },
  refresh: { s: ['M19.5 12a7.5 7.5 0 1 1-2.2-5.3', 'M19.5 4v3.5H16'] },
  cloud_off: { s: ['M7 18.5h10.5a3.5 3.5 0 0 0 .5-7 6 6 0 0 0-11.5-1.5A4.3 4.3 0 0 0 7 18.5z', SLASH], f: ['M7 18.5h10.5a3.5 3.5 0 0 0 .5-7 6 6 0 0 0-11.5-1.5A4.3 4.3 0 0 0 7 18.5z'] },
  visibility: { s: [EYE, C(12, 12, 3)], f: [C(12, 12, 3)] },
  visibility_off: { s: [EYE, C(12, 12, 3), SLASH], f: [C(12, 12, 3)] },
  lock: { s: [LOCK_BODY, 'M8 10.5V7.5a4 4 0 0 1 8 0v3'], f: [LOCK_BODY], d: [C(12, 15.5, 1.3)] },
  lock_open: { s: [LOCK_BODY, 'M8 10.5V7.5a4 4 0 0 1 7.7-1.5'], f: [LOCK_BODY], d: [C(12, 15.5, 1.3)] },
  lock_reset: { s: ['M4.5 12a7.5 7.5 0 1 0 2.2-5.3', 'M4.5 4v3.5H8', R(9.5, 11, 5, 4.5, 1), 'M10.5 11V9.8a1.5 1.5 0 0 1 3 0V11'], f: [R(9.5, 11, 5, 4.5, 1)] },

  /* Editing */
  edit: { s: ['M15.5 4.5l4 4L9 19l-5 1 1-5z', 'M13.5 6.5l4 4'], f: ['M15.5 4.5l4 4L9 19l-5 1 1-5z'] },
  delete: { s: ['M4.5 6.5h15', 'M9.5 6.5V4.5h5v2', TRASH, 'M10 10.5v6', 'M14 10.5v6'], f: ['M6.5 6.5h11l-.9 12.6a1.5 1.5 0 0 1-1.5 1.4H8.9a1.5 1.5 0 0 1-1.5-1.4z'] },
  delete_forever: { s: ['M4.5 6.5h15', 'M9.5 6.5V4.5h5v2', TRASH, 'M10 11l4 4', 'M14 11l-4 4'], f: ['M6.5 6.5h11l-.9 12.6a1.5 1.5 0 0 1-1.5 1.4H8.9a1.5 1.5 0 0 1-1.5-1.4z'] },
  save: { s: ['M6 3.5h10l3.5 3.5v12a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z', 'M8 3.5v4h7v-4', R(7.5, 13, 9, 7.5, 1)], f: [R(7.5, 13, 9, 7.5, 1)] },

  /* Theme */
  light_mode: { s: [C(12, 12, 4), 'M12 2.5v2', 'M12 19.5v2', 'M2.5 12h2', 'M19.5 12h2', 'M5.3 5.3l1.4 1.4', 'M17.3 17.3l1.4 1.4', 'M5.3 18.7l1.4-1.4', 'M17.3 6.7l1.4-1.4'], f: [C(12, 12, 4)] },
  dark_mode: { s: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'], f: ['M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z'], d: [SP(17.5, 6, 2.3)] },

  /* Salon categories */
  sanitizer: { s: [R(6.5, 10, 11, 10.5, 3), 'M10 10V7.5h4V10', 'M12 7.5v-3h4'], f: [R(6.5, 10, 11, 10.5, 3)], d: [SP(12, 15.2, 2.1)] },
  water_drop: { s: ['M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z', 'M9.4 14.6a2.7 2.7 0 0 0 2.1 2.4'], f: ['M12 3.5s6 6.4 6 10.8a6 6 0 0 1-12 0C6 9.9 12 3.5 12 3.5z'] },
  spa: {
    s: ['M12 20c-4.5 0-8-2.8-8.5-7 2.6 0 5 1 6.6 2.6', 'M12 20c4.5 0 8-2.8 8.5-7-2.6 0-5 1-6.6 2.6', 'M12 20c-2.4-1.6-3.5-4.2-3.5-7S10 7.6 12 5.5c2 2.1 3.5 4.7 3.5 7.5S14.4 18.4 12 20z'],
    f: ['M12 20c-2.4-1.6-3.5-4.2-3.5-7S10 7.6 12 5.5c2 2.1 3.5 4.7 3.5 7.5S14.4 18.4 12 20z'],
  },
  science: { s: ['M9.5 3.5h5', 'M10.5 3.5v6L5 18.5a1.5 1.5 0 0 0 1.3 2h11.4a1.5 1.5 0 0 0 1.3-2L13.5 9.5v-6'], f: ['M7.4 15h9.2l2.4 3.5a1.5 1.5 0 0 1-1.3 2H6.3a1.5 1.5 0 0 1-1.3-2z'] },
  waves: { s: [wave(8), wave(12), wave(16)] },
  vital_signs: { s: ['M2.5 12h4l2-4.5 3.5 9 2.5-6 1.5 3h5.5'] },
  dns: { s: [R(4, 4, 16, 6.5, 2), R(4, 13.5, 16, 6.5, 2), 'M7.5 7.25h.01', 'M7.5 16.75h.01', 'M11 7.25h5.5', 'M11 16.75h5.5'], f: [R(4, 4, 16, 6.5, 2)] },
  database: { s: ['M5 6c0-1.7 3.1-2.8 7-2.8s7 1.1 7 2.8-3.1 2.8-7 2.8S5 7.7 5 6z', 'M5 6v12c0 1.7 3.1 2.8 7 2.8s7-1.1 7-2.8V6', 'M5 12c0 1.7 3.1 2.8 7 2.8s7-1.1 7-2.8'], f: ['M5 6c0-1.7 3.1-2.8 7-2.8s7 1.1 7 2.8-3.1 2.8-7 2.8S5 7.7 5 6z'] },
  cloud: { s: ['M7.2 18.5h10a4 4 0 0 0 .6-7.95A5.8 5.8 0 0 0 6.6 9.6 4.5 4.5 0 0 0 7.2 18.5z'], f: ['M7.2 18.5h10a4 4 0 0 0 .6-7.95A5.8 5.8 0 0 0 6.6 9.6 4.5 4.5 0 0 0 7.2 18.5z'] },
  hub: { s: [C(12, 12, 2.6), C(12, 4.5, 1.8), C(5, 17.5, 1.8), C(19, 17.5, 1.8), 'M12 6.3v3.1', 'M6.6 16.5l3.2-2.1', 'M17.4 16.5l-3.2-2.1'], f: [C(12, 12, 2.6)] },
  campaign: { s: ['M4 10v4a1.5 1.5 0 0 0 1.5 1.5H7l5 4V4.5l-5 4H5.5A1.5 1.5 0 0 0 4 10z', 'M16 9a4 4 0 0 1 0 6', 'M18.5 6.5a7.5 7.5 0 0 1 0 11'], f: ['M4 10v4a1.5 1.5 0 0 0 1.5 1.5H7l5 4V4.5l-5 4H5.5A1.5 1.5 0 0 0 4 10z'] },
  content_cut: { s: [C(7, 17, 2.6), C(17, 17, 2.6), 'M8.8 15.2 17.5 4', 'M15.2 15.2 6.5 4'], f: [C(7, 17, 2.6), C(17, 17, 2.6)] },
  brush: { s: [R(7, 10, 10, 10.5, 2.5), 'M9.5 10V7.5h5V10', 'M10.5 7.5v-4h3v4'], f: [R(7, 10, 10, 10.5, 2.5)], d: [SP(12, 15.2, 2)] },
  chair: { s: [R(7, 3.5, 10, 8, 3), R(5, 11, 14, 3.5, 1.5), 'M12 14.5V19', 'M7.5 20.5h9'], f: [R(7, 3.5, 10, 8, 3)] },
};

const ALIASES: Record<string, string> = {
  sell: 'label',
  qr_code_2: 'label',
  receipt: 'receipt_long',
  store: 'storefront',
  shopping_cart: 'shopping_bag',
  done_all: 'check_circle',
  add_business: 'storefront',
  policy: 'shield',
  shield_lock: 'shield',
  auto_awesome: 'sparkle',
  task_alt: 'check_circle',
  play_arrow: 'arrow_forward',
  videocam: 'photo_camera',
  broken_image: 'error',
  swap_horiz: 'swap_vert',
  checklist: 'fact_check',
  undo: 'refresh',
  hourglass_top: 'schedule',
  hourglass_empty: 'schedule',
  do_not_disturb_on: 'block',
  paid: 'payments',
  warning: 'error',
  account_balance_wallet: 'account_balance',
  assignment_return: 'replay',
};

/** Icons whose fill goes fully solid when `filled` (others keep their inner marks visible). */
const SOLID_WHEN_FILLED = new Set(['favorite', 'star', 'bolt']);

export const ICON_NAMES = Object.keys(GLYPHS);

export function Icon({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) {
  const key = ALIASES[name] ?? name;
  const g = GLYPHS[key] ?? GLYPHS.sparkle;
  return (
    <span aria-hidden data-icon={key} data-filled={filled ? (SOLID_WHEN_FILLED.has(key) ? 'solid' : 'soft') : undefined} className={`ic ${className}`}>
      {/* key={name}: the svg remounts when the icon changes, which replays its entrance animation */}
      <svg key={key} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {g.f?.map((d, i) => <path key={`f${i}`} d={d} className="ic-f" fill="currentColor" stroke="none" />)}
        {g.t?.map((d, i) => <path key={`t${i}`} d={d} className="ic-t" />)}
        {g.s.map((d, i) => <path key={`s${i}`} d={d} className="ic-s" pathLength={1} />)}
        {g.d?.map((d, i) => <path key={`d${i}`} d={d} className="ic-d" fill="currentColor" stroke="none" />)}
      </svg>
    </span>
  );
}
