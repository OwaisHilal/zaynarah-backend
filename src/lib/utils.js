// src/lib/utils.js
const { v4: uuidv4 } = require('uuid');

module.exports = {
  makeId: () => uuidv4(),
  toNumber: (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  },
};
