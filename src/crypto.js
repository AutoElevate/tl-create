"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = exports.pkijs = exports.asn1js = void 0;
exports.asn1js = require("asn1js");
exports.pkijs = require("pkijs");
const webcrypto_1 = require("@peculiar/webcrypto");
exports.crypto = new webcrypto_1.Crypto();
const cryptoName = "@peculiar/webcrypto";
exports.pkijs.setEngine(
  cryptoName,
  exports.crypto,
  new exports.pkijs.CryptoEngine({
    name: cryptoName,
    crypto: exports.crypto,
    subtle: exports.crypto.subtle,
  })
);
