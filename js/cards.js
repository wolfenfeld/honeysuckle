// The 30 cat cards. Art lives in cards/<id>.png (or .webp / .jpg); until it exists a drawn placeholder is shown.
export const COST = 30; // points per pack
export const RARITY = {
  1: { name: "נפוץ",     color: "#8e9bb0", weight: 45 },
  2: { name: "לא נפוץ",  color: "#2f9e5b", weight: 27 },
  3: { name: "נדיר",     color: "#2f6fd6", weight: 16 },
  4: { name: "אפי",      color: "#8a3fb0", weight: 8 },
  5: { name: "אגדי",     color: "#e0a800", weight: 4 },
};
export const CARDS = [
 {
  "id": "01",
  "he": "גינג'ר",
  "en": "Ginger",
  "r": 1
 },
 {
  "id": "02",
  "he": "לילה",
  "en": "Midnight",
  "r": 1
 },
 {
  "id": "03",
  "he": "שלגיה",
  "en": "Snowball",
  "r": 1
 },
 {
  "id": "04",
  "he": "עננית",
  "en": "Misty",
  "r": 1
 },
 {
  "id": "05",
  "he": "טלאית",
  "en": "Patches",
  "r": 1
 },
 {
  "id": "06",
  "he": "צמרמר",
  "en": "Yarn",
  "r": 1
 },
 {
  "id": "07",
  "he": "נמנום",
  "en": "Snooze",
  "r": 1
 },
 {
  "id": "08",
  "he": "פסי",
  "en": "Stripes",
  "r": 1
 },
 {
  "id": "09",
  "he": "גרבי",
  "en": "Socks",
  "r": 1
 },
 {
  "id": "10",
  "he": "קרטון",
  "en": "Boxy",
  "r": 1
 },
 {
  "id": "11",
  "he": "חופית",
  "en": "Sandy",
  "r": 2
 },
 {
  "id": "12",
  "he": "טיפה",
  "en": "Drizzle",
  "r": 2
 },
 {
  "id": "13",
  "he": "עוגיה",
  "en": "Cookie",
  "r": 2
 },
 {
  "id": "14",
  "he": "מקצב",
  "en": "Beats",
  "r": 2
 },
 {
  "id": "15",
  "he": "פרחונת",
  "en": "Blossom",
  "r": 2
 },
 {
  "id": "16",
  "he": "צלמית",
  "en": "Snap",
  "r": 2
 },
 {
  "id": "17",
  "he": "גלגלית",
  "en": "Wheelie",
  "r": 2
 },
 {
  "id": "18",
  "he": "קפואית",
  "en": "Frosty",
  "r": 2
 },
 {
  "id": "19",
  "he": "ספרנית",
  "en": "Bookworm",
  "r": 3
 },
 {
  "id": "20",
  "he": "חשבונית",
  "en": "Professor Purr",
  "r": 3
 },
 {
  "id": "21",
  "he": "ספרינטר",
  "en": "Sprinter",
  "r": 3
 },
 {
  "id": "22",
  "he": "ג'ונגלית",
  "en": "Jungle",
  "r": 3
 },
 {
  "id": "23",
  "he": "נהג האוטובוס",
  "en": "Captain Bus",
  "r": 3
 },
 {
  "id": "24",
  "he": "מדענית",
  "en": "Sparky",
  "r": 3
 },
 {
  "id": "25",
  "he": "מיאו־לין",
  "en": "Meowlin",
  "r": 4
 },
 {
  "id": "26",
  "he": "אסטרו",
  "en": "Astro",
  "r": 4
 },
 {
  "id": "27",
  "he": "קפטן שפם",
  "en": "Captain Whisker",
  "r": 4
 },
 {
  "id": "28",
  "he": "פיית פרווה",
  "en": "Fairy Fluff",
  "r": 4
 },
 {
  "id": "29",
  "he": "גלקסיה",
  "en": "Galaxy",
  "r": 5
 },
 {
  "id": "30",
  "he": "מלכת הזהב",
  "en": "Golden Queen",
  "r": 5
 }
];
export const catIcons = (r) => "🐱".repeat(r);
