// "use strict";
// Object.defineProperty(exports, "__esModule", { value: true });
// const tslib_1 = require("tslib");
// tslib_1.__exportStar(require("./tl"), exports);
// tslib_1.__exportStar(require("./formats"), exports);
const tl = require("./tl");
const ms = require("./formats/ms");

module.exports = {
  TrustedList: tl,
  Microsoft: ms,
};
