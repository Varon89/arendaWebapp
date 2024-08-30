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

// function parseText(text) {
//   const cleanText = text.trim().replace(/\n/g, " ").replace(/'/g, '"');
//   const priceListStart = cleanText.indexOf("price_list: {");
//   const priceListEnd = cleanText.indexOf("}", priceListStart) + 1;
//   const priceListStr = cleanText.substring(priceListStart, priceListEnd);
//   const otherFieldsStr = cleanText
//     .substring(0, priceListStart)
//     .replace("/acc_info", "")
//     .trim();

//   let priceList = {};
//   try {
//     priceList = JSON.parse(priceListStr.replace("price_list: ", ""));
//   } catch (error) {
//     console.error("price_list JSON parsing hatası:", error);
//   }

//   const otherFields = otherFieldsStr.split(",").reduce((obj, field) => {
//     const [key, value] = field.split(":").map((part) => part.trim());
//     if (key && value) {
//       obj[key.replace(/"/g, "")] = value.replace(/"/g, "");
//     }
//     return obj;
//   }, {});

//   return { ...otherFields, price_list: priceList };
// }

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

module.exports = {
  convertToTimeFormat,
  chunkArray,
  generateId,
  parseTextSimple,
};
