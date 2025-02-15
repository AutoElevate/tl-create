"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Microsoft = void 0;
const tslib_1 = require("tslib");
const child_process = tslib_1.__importStar(require("child_process"));
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const pvutils = tslib_1.__importStar(require("pvutils"));
const temp = tslib_1.__importStar(require("temp"));
const sync_request_1 = tslib_1.__importDefault(require("sync-request"));
const asn1js = require("asn1js");
const tl_1 = require("../tl");
const ctl_schema = new asn1js.Sequence({
    name: "CTL",
    value: [
        new asn1js.Any({
            name: "dummy1"
        }),
        new asn1js.Integer({
            name: "unknown"
        }),
        new asn1js.UTCTime({
            name: "GenDate"
        }),
        new asn1js.Any({
            name: "dummy2"
        }),
        new asn1js.Sequence({
            name: "InnerCTL",
            value: [
                new asn1js.Repeated({
                    name: "CTLEntry",
                    value: new asn1js.Any()
                })
            ]
        })
    ]
});
const ctlentry_schema = new asn1js.Sequence({
    name: "CTLEntry",
    value: [
        new asn1js.OctetString({
            name: "CertID"
        }),
        new asn1js.Set({
            name: "MetaData",
            value: [
                new asn1js.Repeated({
                    name: "CertMetaData",
                    value: new asn1js.Sequence({
                        value: [
                            new asn1js.ObjectIdentifier({
                                name: "MetaDataType"
                            }),
                            new asn1js.Set({
                                name: "MetaDataValue",
                                value: [
                                    new asn1js.OctetString({
                                        name: "RealContent"
                                    })
                                ]
                            })
                        ]
                    })
                })
            ]
        })
    ]
});
const eku_schema = new asn1js.Sequence({
    name: "EKU",
    value: [
        new asn1js.Repeated({
            name: "OID",
            value: new asn1js.ObjectIdentifier()
        })
    ]
});
const evoid_schema = new asn1js.Sequence({
    name: "EVOIDS",
    value: [
        new asn1js.Repeated({
            name: "PolicyThing",
            value: new asn1js.Sequence({
                value: [
                    new asn1js.ObjectIdentifier({
                        name: "EVOID"
                    }),
                    new asn1js.Any({
                        name: "dummy"
                    })
                ]
            })
        })
    ]
});
const dis_ctl_schema = new asn1js.Sequence({
    name: "DisallowedCTL",
    value: [
        new asn1js.Any({
            name: "dummy1"
        }),
        new asn1js.OctetString({
            name: "dummy2"
        }),
        new asn1js.Integer({
            name: "unknown"
        }),
        new asn1js.UTCTime({
            name: "GenDate"
        }),
        new asn1js.Any({
            name: "dummy3"
        }),
        new asn1js.Sequence({
            name: "InnerCTL",
            value: [
                new asn1js.Repeated({
                    name: "CTLEntry",
                    value: new asn1js.Any()
                })
            ]
        })
    ]
});
const dis_ctlentry_schema = new asn1js.Sequence({
    name: "DisallowedCTLEntry",
    value: [
        new asn1js.OctetString({
            name: "CertID"
        })
    ]
});
const EKU_oids = {
    "1.3.6.1.5.5.7.3.1": "SERVER_AUTH",
    "1.3.6.1.5.5.7.3.2": "CLIENT_AUTH",
    "1.3.6.1.5.5.7.3.3": "CODE_SIGNING",
    "1.3.6.1.5.5.7.3.4": "EMAIL_PROTECTION",
    "1.3.6.1.5.5.7.3.5": "IPSEC_END_SYSTEM",
    "1.3.6.1.5.5.7.3.6": "IPSEC_TUNNEL",
    "1.3.6.1.5.5.7.3.7": "IPSEC_USER",
    "1.3.6.1.5.5.7.3.8": "TIME_STAMPING",
    "1.3.6.1.5.5.7.3.9": "OCSP_SIGNING",
    "1.3.6.1.5.5.8.2.2": "IPSEC_PROTECTION",
    "1.3.6.1.4.1.311.10.3.12": "DOCUMENT_SIGNING",
    "1.3.6.1.4.1.311.10.3.4": "EFS_CRYPTO"
};
const microsoftTrustedURL = "http://www.download.windowsupdate.com/msdownload/update/v3/static/trustedr/en/authrootstl.cab";
const microsoftTrustedFilename = "authroot.stl";
const microsoftDisallowedURL = "http://www.download.windowsupdate.com/msdownload/update/v3/static/trustedr/en/disallowedcertstl.cab";
const microsoftDisallowedFilename = "disallowedcert.stl";
class Microsoft {
    getTrusted(data, skipFetch = false) {
        var _a, _b;
        let tl = new tl_1.TrustedList();
        let databuf;
        if (!data)
            databuf = this.fetchSTL(microsoftTrustedURL, microsoftTrustedFilename);
        else
            databuf = Buffer.from(data, "binary");
        let variant;
        for (let i = 0; i < databuf.buffer.byteLength; i++) {
            variant = asn1js.verifySchema(databuf.buffer.slice(i), ctl_schema);
            if (variant.verified === true)
                break;
        }
        if (variant.verified === false)
            throw new Error("Cannot parse STL");
        if (!skipFetch)
            process.stdout.write("Fetching certificates");
        for (let ctlentry of variant.result.CTLEntry) {
            if (!skipFetch)
                process.stdout.write(".");
            let ctlentry_parsed = asn1js.verifySchema(ctlentry.toBER(), ctlentry_schema);
            let certid = pvutils.bufferToHexCodes(ctlentry_parsed.result.CertID.valueBlock.valueHex);
            let certraw = "";
            if (!skipFetch)
                certraw = this.fetchcert(certid);
            let tl_cert = {
                raw: certraw,
                trust: [],
                operator: "",
                source: "Microsoft",
                evpolicy: [],
                thumbprint: certid
            };
            for (let metadata of ctlentry_parsed.result.CertMetaData) {
                let metadata_oid = metadata.valueBlock.value[0].valueBlock.toString();
                if (metadata_oid === "1.3.6.1.4.1.311.10.11.9") {
                    let ekus = asn1js.verifySchema(metadata.valueBlock.value[1].valueBlock.value[0].valueBlock.valueHex, eku_schema);
                    for (let eku of ekus.result.OID) {
                        let eku_oid = eku.valueBlock.toString();
                        if (eku_oid in EKU_oids)
                            (_a = tl_cert.trust) === null || _a === void 0 ? void 0 : _a.push(EKU_oids[eku_oid]);
                    }
                }
                if (metadata_oid === "1.3.6.1.4.1.311.10.11.11") {
                    tl_cert.operator = String.fromCharCode.apply(null, new Uint16Array(metadata.valueBlock.value[1].valueBlock.value[0].valueBlock.valueHex)).slice(0, -1);
                }
                if (metadata_oid === "1.3.6.1.4.1.311.10.11.83") {
                    let evoids = asn1js.verifySchema(metadata.valueBlock.value[1].valueBlock.value[0].valueBlock.valueHex, evoid_schema);
                    for (let evoid of evoids.result.PolicyThing) {
                        (_b = tl_cert.evpolicy) === null || _b === void 0 ? void 0 : _b.push(evoid.valueBlock.value[0].valueBlock.toString());
                    }
                }
            }
            tl.AddCertificate(tl_cert);
        }
        if (!skipFetch)
            console.log();
        return tl;
    }
    getDisallowed(data, skipFetch = false) {
        let tl = new tl_1.TrustedList();
        let databuf;
        if (!data)
            databuf = this.fetchSTL(microsoftDisallowedURL, microsoftDisallowedFilename);
        else
            databuf = Buffer.from(data, "binary");
        let variant;
        for (let i = 0; i < databuf.buffer.byteLength; i++) {
            variant = asn1js.verifySchema(databuf.buffer.slice(i), dis_ctl_schema);
            if (variant.verified === true)
                break;
        }
        if (variant.verified === false)
            throw new Error("Cannot parse STL");
        if (!skipFetch)
            process.stdout.write("Fetching certificates");
        for (let ctlentry of variant.result.CTLEntry) {
            if (!skipFetch)
                process.stdout.write(".");
            let ctlentry_parsed = asn1js.verifySchema(ctlentry.toBER(), dis_ctlentry_schema);
            let certid = pvutils.bufferToHexCodes(ctlentry_parsed.result.CertID.valueBlock.valueHex);
            let certraw = "";
            if (!skipFetch)
                certraw = this.fetchcert(certid);
            let tl_cert = {
                raw: certraw,
                trust: [],
                operator: "Unknown",
                source: "Microsoft",
                evpolicy: []
            };
            tl.AddCertificate(tl_cert);
        }
        if (!skipFetch)
            console.log();
        return tl;
    }
    fetchcert(certid) {
        let url = "http://www.download.windowsupdate.com/msdownload/update/v3/static/trustedr/en/" + certid + ".crt";
        let res = sync_request_1.default("GET", url, { "timeout": 10000, "retry": true, "headers": { "user-agent": "nodejs" } });
        return res.body.toString("base64");
    }
    fetchSTL(uri, filename) {
        let res = sync_request_1.default("GET", uri, { "timeout": 10000, "retry": true, "headers": { "user-agent": "nodejs" } });
        let dirpath = temp.mkdirSync("authrootstl");
        fs.writeFileSync(path.join(dirpath, filename + ".cab"), res.body);
        if (process.platform === "win32")
            child_process.execSync("expand " + filename + ".cab .", { cwd: dirpath });
        else
            child_process.execSync("cabextract " + filename + ".cab", { cwd: dirpath });
        let data = fs.readFileSync(path.join(dirpath, filename));
        fs.unlinkSync(path.join(dirpath, filename));
        fs.unlinkSync(path.join(dirpath, filename + ".cab"));
        temp.cleanupSync();
        return data;
    }
}
exports.Microsoft = Microsoft;
