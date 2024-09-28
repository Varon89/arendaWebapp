const { token } = require("../mocks/security");

const convertToTimeFormat = (value) => {
  const num = parseFloat(value);
  if (num >= 24) {
    const days = Math.floor(num / 24);
    const remainingHours = num % 24;
    if (remainingHours > 0) {
      return `${days} kun ${remainingHours.toFixed(1).replace(".0", "")} soat`;
    } else {
      return `${days} kun`;
    }
  }
  const hours = Math.floor(num);
  const minutes = Math.round((num - hours) * 60);
  if (minutes === 0) {
    return `${hours} soat`;
  } else if (minutes === 60) {
    return `${hours + 1} soat`;
  } else {
    return `${hours} soat ${minutes} minut`;
  }
};

const chunkArray = (array, size) => {
  const chunkedArray = [];
  for (let i = 0; i < array.length; i += size) {
    chunkedArray.push(array.slice(i, i + size));
  }
  return chunkedArray;
};

const generateId = () => {
  const min = 100000;
  const max = 999999;
  const uniqueNumber = Math.floor(min + Math.random() * (max - min + 1));
  return uniqueNumber.toString();
};

const filePathCache = {};
const getImgPathLink = async (fileId) => {
  if (filePathCache[fileId]) {
    return filePathCache[fileId];
  }
  const response = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`
  );
  const data = await response.json();
  const filePath = `https://api.telegram.org/file/bot${token}/${data.result.file_path}`;
  filePathCache[fileId] = filePath;
  return filePath;
};

const parseTextSimple = (text) => {
  const result = {};
  const cleanedText = text.split("/acc_info")[1].trim();
  const priceListStart = cleanedText.indexOf("price_list: {");
  const priceListEnd = cleanedText.indexOf("}", priceListStart) + 1;
  const priceListStr = cleanedText.substring(priceListStart, priceListEnd);
  const otherText = cleanedText.substring(0, priceListStart).trim();
  const priceList = {};
  const priceListText = priceListStr
    .replace("price_list: {", "")
    .replace("}", "")
    .split(",")
    .map((line) =>
      line
        .trim()
        .split(":")
        .map((part) => part.trim())
    );

  priceListText.forEach(([key, value]) => {
    if (key && value) {
      priceList[key.replace(/'/g, "")] = value.replace(/'/g, "");
    }
  });

  result.price_list = priceList;
  const otherFields = otherText
    .split(",")
    .map((field) => field.split(":").map((part) => part.trim()));
  otherFields.forEach(([key, value]) => {
    if (key && value) {
      result[key.replace(/'/g, "")] = value.replace(/'/g, "");
    }
  });

  return result;
};

const calculateEndDateTime = (obj) => {
  const startDate = new Date(obj.start_date);
  const [hours, minutes] = obj.start_hour.split(":").map(Number);
  startDate.setHours(hours, minutes);

  const endDate = new Date(startDate.getTime() + obj.time * 60 * 60 * 1000);

  const formatDate = (date) =>
    `${new Date().getFullYear()}.${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}.${String(date.getDate()).padStart(2, "0")}`;
  const formatTime = (date) =>
    `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;

  return {
    ...obj,
    start_date: formatDate(startDate),
    end_date: formatDate(endDate),
    start_hour: formatTime(startDate),
    end_hour: formatTime(endDate),
  };
};

module.exports = {
  convertToTimeFormat,
  chunkArray,
  generateId,
  parseTextSimple,
  getImgPathLink,
  calculateEndDateTime,
};
