const generalCommands = [
  { command: "start", description: "Start" },
  { command: "konkurs", description: "Konkurs" },
];
const adminCommands = [
  { command: "start", description: "Start" },
  { command: "shablon", description: "Shablon tayyorlash" },
  { command: "add_acc", description: "Acc qo'shish" },
  {
    command: "get_all_user",
    description: "Barcha foydalanuvchilar ro'yxatini olish",
  },
  {
    command: "get_user_by_id",
    description: "ID bo'yicha foydalanuvchini topish",
  },
  { command: "hisobla", description: "Hisoblash" },
  { command: "top5", description: "Top 5" },
];
const myCommands = [
  { command: "start", description: "Start" },
  { command: "daily", description: "Daily" },
  { command: "hisobla", description: "Hisobla" },
  { command: "weekly", description: "Weekly" },
  { command: "monthly", description: "Monthly" },
];

const accData = [
  "#V1",
  "#V2",
  "#V3",
  "#V4",
  "#V5",
  "#V6",
  "#V7",
  "#V8",
  "#V9",
  "#V10",
  "#T1",
  "#T2",
  "#T3",
  "#T4",
  "#M1",
  "#M2",
  "#M3",
  "#M4",
  "#M5",
  "#CH1",
  "#CH2",
  "#CH3",
  "#CH4",
];
const myAccs = [
  "#V1",
  "#V3",
  "#V5",
  "#V8",
  "#V10",
  "#T2",
  "#T3",
  "#M1",
  "#M2",
  "#M5",
  "#CH1",
  "#CH2",
  "#CH3",
  "#CH4",
];
const others_accs = [
  "#V2",
  "#V4",
  "#V6",
  "#V7",
  "#V9",
  "#T1",
  "#T4",
  "#M3",
  "#M4",
];
module.exports = {
  adminCommands,
  myCommands,
  generalCommands,
  accData,
  myAccs,
  others_accs,
};
