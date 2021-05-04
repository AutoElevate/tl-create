"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cisco = void 0;
const tslib_1 = require("tslib");
const pvutils = tslib_1.__importStar(require("pvutils"));
const sync_request_1 = tslib_1.__importDefault(require("sync-request"));
const TrustedList = require("../tl");
const crypto_1 = require("../crypto");
class Cisco {
  constructor(
    store = "external",
    { url = Cisco.URL, timeout = Cisco.TIMEOUT } = {}
  ) {
    this.url = url;
    this.timeout = timeout;
    switch (store) {
      case "external":
        this.fetchurl = this.url + "ios.p7b";
        this.source = "Cisco Trusted External Root Bundle";
        break;
      case "union":
        this.fetchurl = this.url + "ios_union.p7b";
        this.source = "Cisco Trusted Union Root Bundle";
        break;
      case "core":
        this.fetchurl = this.url + "ios_core.p7b";
        this.source = "Cisco Trusted Core Root Bundle";
        break;
      default:
        throw new Error(`Unknown CISCO store type '${store}'`);
    }
  }
  getTrusted(data) {
    let tl = new TrustedList();
    let dataBuf;
    if (!data) {
      let res = sync_request_1.default("GET", this.fetchurl, {
        timeout: this.timeout,
        retry: true,
        headers: { "user-agent": "nodejs" },
      });
      dataBuf = Buffer.isBuffer(res.body)
        ? new Uint8Array(res.body).buffer
        : new Uint8Array(Buffer.from(res.body)).buffer;
    } else {
      dataBuf = pvutils.stringToArrayBuffer(data);
    }
    const asn1obj = crypto_1.asn1js.fromBER(dataBuf);
    const contentInfo = new crypto_1.pkijs.ContentInfo({
      schema: asn1obj.result,
    });
    if (contentInfo.contentType !== "1.2.840.113549.1.7.2")
      throw new Error(
        `Unknown content type '${contentInfo.contentType}' for contentInfo`
      );
    this.signedData = new crypto_1.pkijs.SignedData({
      schema: contentInfo.content,
    });
    let asn1obj2 = crypto_1.asn1js.fromBER(
      this.signedData.encapContentInfo.eContent.valueBlock.valueHex
    );
    let contentInfo2 = new crypto_1.pkijs.ContentInfo({
      schema: asn1obj2.result,
    });
    if (contentInfo.contentType !== "1.2.840.113549.1.7.2")
      throw new Error(
        `Unknown content type '${contentInfo.contentType}' for contentInfo`
      );
    let signedData2 = new crypto_1.pkijs.SignedData({
      schema: contentInfo2.content,
    });
    for (let cert of signedData2.certificates) {
      let operator = "Unknown";
      for (let rdn of cert.subject.typesAndValues) {
        if (rdn.type === "2.5.4.10") {
          operator = rdn.value.valueBlock.value;
          break;
        }
      }
      tl.AddCertificate({
        raw: pvutils.toBase64(
          pvutils.arrayBufferToString(cert.toSchema(true).toBER())
        ),
        trust: ["ANY"],
        operator: operator,
        source: this.source,
        evpolicy: [],
      });
    }
    return tl;
  }
  getDisallowed(data) {
    return new TrustedList();
  }
  async verifyP7() {
    return this.signedData.verify({ signer: 0 });
  }
}
module.exports = Cisco;
Cisco.URL = "https://www.cisco.com/security/pki/trs/";
Cisco.TIMEOUT = 1e4;
