"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mozilla = void 0;
const tslib_1 = require("tslib");
const XmlCore = tslib_1.__importStar(require("xml-core"));
const sync_request_1 = tslib_1.__importDefault(require("sync-request"));
const TrustedList = require("../tl");
const MozillaAttributes = {
  CKA_CLASS: "CKA_CLASS",
  CKA_TOKEN: "CKA_TOKEN",
  CKA_PRIVATE: "CKA_PRIVATE",
  CKA_MODIFIABLE: "CKA_MODIFIABLE",
  CKA_LABEL: "CKA_LABEL",
  CKA_CERTIFICATE_TYPE: "CKA_CERTIFICATE_TYPE",
  CKA_SUBJECT: "CKA_SUBJECT",
  CKA_ID: "CKA_ID",
  CKA_ISSUER: "CKA_ISSUER",
  CKA_SERIAL_NUMBER: "CKA_SERIAL_NUMBER",
  CKA_EXPIRES: "CKA_EXPIRES",
  CKA_VALUE: "CKA_VALUE",
  CKA_NSS_EMAIL: "CKA_NSS_EMAIL",
  CKA_CERT_SHA1_HASH: "CKA_CERT_SHA1_HASH",
  CKA_CERT_MD5_HASH: "CKA_CERT_MD5_HASH",
  CKA_TRUST_DIGITAL_SIGNATURE: "CKA_TRUST_DIGITAL_SIGNATURE",
  CKA_TRUST_NON_REPUDIATION: "CKA_TRUST_NON_REPUDIATION",
  CKA_TRUST_KEY_ENCIPHERMENT: "CKA_TRUST_KEY_ENCIPHERMENT",
  CKA_TRUST_DATA_ENCIPHERMENT: "CKA_TRUST_DATA_ENCIPHERMENT",
  CKA_TRUST_KEY_AGREEMENT: "CKA_TRUST_KEY_AGREEMENT",
  CKA_TRUST_KEY_CERT_SIGN: "CKA_TRUST_KEY_CERT_SIGN",
  CKA_TRUST_CRL_SIGN: "CKA_TRUST_CRL_SIGN",
  CKA_TRUST_SERVER_AUTH: "CKA_TRUST_SERVER_AUTH",
  CKA_TRUST_CLIENT_AUTH: "CKA_TRUST_CLIENT_AUTH",
  CKA_TRUST_CODE_SIGNING: "CKA_TRUST_CODE_SIGNING",
  CKA_TRUST_EMAIL_PROTECTION: "CKA_TRUST_EMAIL_PROTECTION",
  CKA_TRUST_IPSEC_END_SYSTEM: "CKA_TRUST_IPSEC_END_SYSTEM",
  CKA_TRUST_IPSEC_TUNNEL: "CKA_TRUST_IPSEC_TUNNEL",
  CKA_TRUST_IPSEC_USER: "CKA_TRUST_IPSEC_USER",
  CKA_TRUST_TIME_STAMPING: "CKA_TRUST_TIME_STAMPING",
  CKA_TRUST_STEP_UP_APPROVED: "CKA_TRUST_STEP_UP_APPROVED",
  CKT_NSS_TRUSTED_DELEGATOR: "CKT_NSS_TRUSTED_DELEGATOR",
  CKT_NSS_MUST_VERIFY_TRUST: "CKT_NSS_MUST_VERIFY_TRUST",
  CKT_NSS_NOT_TRUSTED: "CKT_NSS_NOT_TRUSTED",
  CKA_NSS_MOZILLA_CA_POLICY: "CKA_NSS_MOZILLA_CA_POLICY",
  CKA_NSS_SERVER_DISTRUST_AFTER: "CKA_NSS_SERVER_DISTRUST_AFTER",
  CKA_NSS_EMAIL_DISTRUST_AFTER: "CKA_NSS_EMAIL_DISTRUST_AFTER",
};
const MozillaTypes = {
  CK_BBOOL: "CK_BBOOL",
  UTF8: "UTF8",
  CK_OBJECT_CLASS: "CK_OBJECT_CLASS",
  CK_CERTIFICATE_TYPE: "CK_CERTIFICATE_TYPE",
  MULTILINE_OCTAL: "MULTILINE_OCTAL",
  CK_TRUST: "CK_TRUST",
};
class Mozilla {
  constructor(
    codeFilter = ["CKA_TRUST_ALL"],
    { url = Mozilla.URL, timeout = Mozilla.TIMEOUT } = {}
  ) {
    this.attributes = [];
    this.certText = null;
    this.curIndex = 0;
    this.url = url;
    this.timeout = timeout;
    for (let i in codeFilter) {
      codeFilter[i] = "CKA_TRUST_" + codeFilter[i];
    }
    this.codeFilterList = codeFilter;
  }
  getTrusted(data) {
    return this.getByTrustValue(
      data,
      MozillaAttributes.CKT_NSS_TRUSTED_DELEGATOR
    );
  }
  getDisallowed(data) {
    return this.getByTrustValue(data, MozillaAttributes.CKT_NSS_NOT_TRUSTED);
  }
  getByTrustValue(data, trustVal) {
    var _a, _b, _c;
    let tl = new TrustedList();
    if (data) {
      this.certText = data.replace(/\r\n/g, "\n").split("\n");
    } else {
      let res = sync_request_1.default("GET", this.url, {
        timeout: this.timeout,
        retry: true,
        headers: { "user-agent": "nodejs" },
      });
      this.certText = res.body.toString().replace(/\r\n/g, "\n").split("\n");
    }
    this.findObjectDefinitionsSegment();
    this.findTrustSegment();
    this.findBeginDataSegment();
    this.findClassSegment();
    let certs = [];
    let ncc_trust = [];
    while (
      this.curIndex <
      ((_b =
        (_a = this.certText) === null || _a === void 0 ? void 0 : _a.length) !==
        null && _b !== void 0
        ? _b
        : 0)
    ) {
      let item = this.parseListItem();
      switch (item[MozillaAttributes.CKA_CLASS]) {
        case "CKO_CERTIFICATE":
          certs.push(item);
          break;
        case "CKO_NSS_TRUST":
          ncc_trust.push(item);
          break;
      }
      this.findClassSegment();
    }
    let c = 0;
    for (let cert of certs) {
      let tl_cert = {
        raw: cert[MozillaAttributes.CKA_VALUE],
        trust: [],
        operator: cert[MozillaAttributes.CKA_LABEL],
        source: "Mozilla",
        evpolicy: [],
      };
      let ncc = this.findNcc(cert, ncc_trust);
      for (let i in ncc) {
        let m = /^CKA_TRUST_(\w+)/.exec(i);
        if (m && m[1] !== "STEP_UP_APPROVED" && ncc[i] === trustVal)
          (_c = tl_cert.trust) === null || _c === void 0
            ? void 0
            : _c.push(m[1]);
      }
      tl.AddCertificate(tl_cert);
    }
    tl.filter(this.emptyTrustFilter);
    return tl;
  }
  findNcc(cert, nccs) {
    for (let ncc of nccs) {
      if (
        cert[MozillaAttributes.CKA_ISSUER] ===
          ncc[MozillaAttributes.CKA_ISSUER] &&
        cert[MozillaAttributes.CKA_SERIAL_NUMBER] ===
          ncc[MozillaAttributes.CKA_SERIAL_NUMBER]
      )
        return ncc;
    }
  }
  findObjectDefinitionsSegment() {
    this.findSegment("Certificates");
  }
  findTrustSegment() {
    this.findSegment("Trust");
  }
  findBeginDataSegment() {
    this.findSegment("BEGINDATA");
  }
  findClassSegment() {
    this.findSegment(MozillaAttributes.CKA_CLASS);
  }
  findSegment(name) {
    while (this.curIndex < this.certText.length) {
      let patt = new RegExp(`(${name})`);
      let res = this.certText[this.curIndex].match(patt);
      if (res) {
        return;
      }
      this.curIndex++;
    }
  }
  getValue(type, value = []) {
    let _value = value.join(" ");
    switch (type) {
      case MozillaTypes.CK_BBOOL:
        return _value === "CK_TRUE" ? true : false;
      case MozillaTypes.CK_CERTIFICATE_TYPE:
      case MozillaTypes.CK_OBJECT_CLASS:
      case MozillaTypes.CK_TRUST:
        return _value;
      case MozillaTypes.MULTILINE_OCTAL:
        let row = null;
        let res = [];
        while ((row = this.certText[++this.curIndex])) {
          if (row.match(/END/)) {
            break;
          }
          let vals = row.split(/\\/g);
          vals.shift();
          for (let item of vals) {
            res.push(parseInt(item, 8));
          }
        }
        return XmlCore.Convert.ToBase64(new Uint8Array(res));
      case MozillaTypes.UTF8:
        let utf8 = _value
          .slice(1, _value.length - 1)
          .replace(/\%/g, "%25")
          .replace(/\\x/g, "%");
        return decodeURIComponent(utf8);
      default:
        throw new Error(`Unknown Mozilla type in use '${type}'`);
    }
  }
  getAttribute(row) {
    let attr = null;
    if (!row || row.match(/^#/)) return null;
    let vals = row.split(" ");
    if (vals[0] in MozillaAttributes) {
      attr = {
        name: vals[0],
        type: vals[1],
        value: this.getValue(vals[1], vals.slice(2)),
      };
    } else throw new Error(`Can not parse row ${this.curIndex}: ${row}`);
    return attr;
  }
  parseListItem() {
    let cert = {};
    let attr = null;
    while ((attr = this.getAttribute(this.certText[this.curIndex]))) {
      cert[attr.name] = attr.value;
      this.curIndex++;
    }
    return cert;
  }
  emptyTrustFilter(item, index) {
    var _a, _b;
    if (
      (_b =
        (_a = item.trust) === null || _a === void 0 ? void 0 : _a.length) !==
        null && _b !== void 0
        ? _b
        : 0 > 0
    )
      return true;
    else return false;
  }
}
module.exports = Mozilla;
Mozilla.URL =
  "https://hg.mozilla.org/mozilla-central/raw-file/tip/security/nss/lib/ckfw/builtins/certdata.txt";
Mozilla.TIMEOUT = 1e4;
