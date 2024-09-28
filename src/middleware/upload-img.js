const path = require("path");
const sharp = require("sharp");

const getImgPathLink = async (fileId) => {
  const imgPath = path.join(__dirname, `../imgs/${fileId}`);
  return imgPath;
};

const resizeImg = async (fileId) => {
  const imgPath = path.join(__dirname, `../imgs/${fileId}`);
  const img = sharp(imgPath);
  const resizedImg = img.resize(200, 200);
  await resizedImg.toFile(imgPath);
};

module.exports = { getImgPathLink, resizeImg };
