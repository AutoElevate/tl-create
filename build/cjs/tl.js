"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustedList = void 0;
class TrustedList {
    constructor() {
        this.m_certificates = [];
    }
    get Certificates() {
        return this.m_certificates;
    }
    AddCertificate(cert) {
        cert.raw = cert.raw.replace(/-----(BEGIN|END) CERTIFICATE-----/g, "").replace(/\s/g, "");
        this.m_certificates.push(cert);
    }
    toJSON() {
        let res = [];
        for (let cert of this.Certificates)
            res.push(cert);
        return res;
    }
    concat(tl) {
        if (tl)
            this.m_certificates = this.Certificates.concat(tl.Certificates);
        return this;
    }
    filter(callbackfn, thisArg) {
        this.m_certificates = this.Certificates.filter(callbackfn);
        return this;
    }
    toString() {
        var _a, _b, _c;
        let res = [];
        for (let cert of this.Certificates) {
            let pem = "";
            for (let i = 0, count = 0; i < cert.raw.length; i++, count++) {
                if (count > 63) {
                    pem = `${pem}\r\n`;
                    count = 0;
                }
                pem = pem + cert.raw[i];
            }
            res.push("Operator: " + cert.operator);
            res.push("Source: " + cert.source);
            if ((_b = (_a = cert.evpolicy) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0 > 0)
                res.push("EV OIDs: " + ((_c = cert.evpolicy) === null || _c === void 0 ? void 0 : _c.join(", ")));
            res.push("-----BEGIN CERTIFICATE-----");
            res.push(pem);
            res.push("-----END CERTIFICATE-----");
        }
        return res.join("\n");
    }
}
exports.TrustedList = TrustedList;
