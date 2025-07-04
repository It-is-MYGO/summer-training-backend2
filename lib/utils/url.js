const { BASE_URL, UPLOADS_PATH } = require('../../config/constants');

function getImageUrl(filename) {
  return `${BASE_URL}${UPLOADS_PATH}${filename}`;
}

module.exports = { getImageUrl }; 