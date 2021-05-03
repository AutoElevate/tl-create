#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = tslib_1.__importDefault(require("commander"));
const XAdES = tslib_1.__importStar(require("xadesjs"));
const xmldom_1 = require("xmldom");
const pvutils = tslib_1.__importStar(require("pvutils"));
const nodeCrypto = tslib_1.__importStar(require("crypto"));
const tl_create = tslib_1.__importStar(require(".."));
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const crypto_1 = require("../crypto");
global["DOMParser"] = xmldom_1.DOMParser;
global["XMLSerializer"] = xmldom_1.XMLSerializer;
XAdES.Application.setEngine("@peculiar/webcrypto", crypto_1.crypto);
function getDateTime() {
  let date = new Date();
  let hour = date.getHours();
  hour = +(hour < 10 ? "0" : "") + hour;
  let min = date.getMinutes();
  min = +(min < 10 ? "0" : "") + min;
  let sec = date.getSeconds();
  sec = +(sec < 10 ? "0" : "") + sec;
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  month = +(month < 10 ? "0" : "") + month;
  let day = date.getDate();
  day = +(day < 10 ? "0" : "") + day;
  return `${year}:${month}:${day}:${hour}:${min}:${sec}`;
}
commander_1.default
  .version(require(path.join(__dirname, "../../../package.json")).version)
  .option("-e, --eutl", "EU Trust List Parse")
  .option("-m, --mozilla", "Mozilla Trust List Parse")
  .option("-s, --microsoft", "Microsoft Trust List Parse")
  .option("-a, --apple", "Apple Trust List Parse")
  .option("-c, --cisco", "Cisco Trust List Parse")
  .option(
    "-C, --ciscotype [type]",
    "Select Cisco Trusted Root Store (external/union/core)",
    "external"
  )
  .option("-f, --for [type]", "Add the specified type for parse", "ALL")
  .option(
    "-o, --format [format]",
    "Add the specified type for output format",
    "pem"
  )
  .option("-d, --disallowed", "Fetch disallowed roots instead of trusted");
commander_1.default.on("--help", () => {
  console.log("  Examples:");
  console.log("");
  console.log("    $ tl-create --mozilla --format pem roots.pem");
  console.log(
    '    $ tl-create --mozilla --for "EMAIL_PROTECTION,CODE_SIGNING" --format pem roots.pem'
  );
  console.log("    $ tl-create --eutl --format pem roots.pem");
  console.log("    $ tl-create --eutl --format js roots.js");
  console.log("    $ tl-create --microsoft --format pem roots.pem");
  console.log(
    "    $ tl-create --microsoft --disallowed --format pem disallowedroots.pem"
  );
  console.log("    $ tl-create --apple --format pem roots.pem");
  console.log(
    "    $ tl-create --cisco --ciscotype core --format pem roots.pem"
  );
  console.log("");
});
commander_1.default.on("--help", () => {
  console.log("  Types:");
  console.log("");
  console.log("    DIGITAL_SIGNATURE");
  console.log("    NON_REPUDIATION");
  console.log("    KEY_ENCIPHERMENT");
  console.log("    DATA_ENCIPHERMENT");
  console.log("    KEY_AGREEMENT");
  console.log("    KEY_CERT_SIGN");
  console.log("    CRL_SIGN");
  console.log("    SERVER_AUTH");
  console.log("    CLIENT_AUTH");
  console.log("    CODE_SIGNING");
  console.log("    EMAIL_PROTECTION");
  console.log("    IPSEC_END_SYSTEM");
  console.log("    IPSEC_TUNNEL");
  console.log("    IPSEC_USER");
  console.log("    IPSEC_PROTECTION");
  console.log("    TIME_STAMPING");
  console.log("    STEP_UP_APPROVED");
  console.log("    OCSP_SIGNING");
  console.log("    DOCUMENT_SIGNING");
  console.log("    EFS_CRYPTO");
  console.log("");
});
commander_1.default.parse(process.argv);
function parseEUTLTrusted() {
  console.log("Trust Lists: EUTL");
  let eutl = new tl_create.EUTL();
  let tl = eutl.getTrusted();
  Promise.all(
    eutl.TrustServiceStatusLists.map(function (list) {
      return list.CheckSignature();
    })
  )
    .then(function (verify) {
      if (!verify) console.log("Warning!!!: EUTL signature is not valid");
      else console.log("Information: EUTL signature is valid");
    })
    .catch(function (e) {
      console.log("Error:", e.message);
    });
  return tl;
}
function parseEUTLDisallowed() {
  throw "EUTL does not support disallowed certificates.";
}
function parseMozillaTrusted() {
  console.log("Trust Lists: Mozilla");
  let moz = new tl_create.Mozilla();
  let tl = moz.getTrusted();
  return tl;
}
function parseMozillaDisallowed() {
  console.log("Trust Lists: Mozilla");
  let moz = new tl_create.Mozilla();
  let tl = moz.getDisallowed();
  return tl;
}
function parseMicrosoftTrusted() {
  console.log("Trust Lists: Microsoft");
  let ms = new tl_create.Microsoft();
  let tl = ms.getTrusted();
  return tl;
}
function parseMicrosoftDisallowed() {
  console.log("Trust Lists: Microsoft");
  let ms = new tl_create.Microsoft();
  let tl = ms.getDisallowed();
  return tl;
}
function parseAppleTrusted() {
  console.log("Trust Lists: Apple");
  let apple = new tl_create.Apple();
  let tl = apple.getTrusted();
  return tl;
}
function parseAppleDisallowed() {
  console.log("Trust Lists: Apple");
  let apple = new tl_create.Apple();
  let tl = apple.getDisallowed();
  return tl;
}
function parseCiscoTrusted(ciscoType) {
  console.log(`Trust Lists: Cisco - ${ciscoType}`);
  let cisco = new tl_create.Cisco(ciscoType);
  let tl = cisco.getTrusted();
  cisco
    .verifyP7()
    .then(function (verify) {
      if (!verify)
        console.log("Warning!!!: Cisco PKCS#7 signature verification failed");
      else
        console.log(
          "Information: Cisco PKCS#7 signature verification successful"
        );
    })
    .catch(function (e) {
      console.log("Error:", e);
    });
  return tl;
}
function parseCiscoDisallowed() {
  throw new Error("Cisco does not support disallowed certificates.");
}
function jsonToPKIJS(json) {
  let _pkijs = [];
  for (let i in json) {
    let raw = json[i].raw;
    if (raw) _pkijs.push(raw);
  }
  return _pkijs;
}
let filter = commander_1.default.for.split(",");
function trustFilter(item) {
  if (item.source === "EUTL") return true;
  if (item.trust.indexOf("ANY") !== -1) return true;
  for (let i in filter) {
    let f = filter[i];
    if (item.trust.indexOf(f) !== -1) return true;
  }
  return false;
}
if (!commander_1.default.args.length) {
  if (commander_1.default.format !== "files") {
    commander_1.default.help();
  }
}
console.log("Parsing started: " + getDateTime());
let outputFile = commander_1.default.args[0];
let eutlTL, mozTL, msTL, appleTL, ciscoTL;
if (commander_1.default.eutl) {
  try {
    if (!commander_1.default.disallowed) eutlTL = parseEUTLTrusted();
    else eutlTL = parseEUTLDisallowed();
  } catch (e) {
    if (e.stack) console.log(e.toString(), e.stack);
    else console.log(e.toString());
  }
}
if (commander_1.default.mozilla) {
  try {
    if (!commander_1.default.disallowed) mozTL = parseMozillaTrusted();
    else mozTL = parseMozillaDisallowed();
  } catch (e) {
    console.log(e.toString());
  }
}
if (commander_1.default.microsoft) {
  try {
    if (!commander_1.default.disallowed) msTL = parseMicrosoftTrusted();
    else msTL = parseMicrosoftDisallowed();
  } catch (e) {
    console.log(e.toString());
  }
}
if (commander_1.default.apple) {
  try {
    if (!commander_1.default.disallowed) appleTL = parseAppleTrusted();
    else appleTL = parseAppleDisallowed();
  } catch (e) {
    console.log(e.toString());
  }
}
if (commander_1.default.cisco) {
  try {
    if (!commander_1.default.disallowed)
      ciscoTL = parseCiscoTrusted(commander_1.default.ciscotype);
    else ciscoTL = parseCiscoDisallowed();
  } catch (e) {
    console.log(e.toString());
  }
}
let tl = new tl_create.TrustedList();
if (mozTL) tl = mozTL.concat(tl);
if (eutlTL) tl = eutlTL.concat(tl);
if (msTL) tl = msTL.concat(tl);
if (appleTL) tl = appleTL.concat(tl);
if (ciscoTL) tl = ciscoTL.concat(tl);
if (tl === null) {
  console.log("Cannot fetch any Trust Lists.");
  process.exit(1);
}
if (filter.indexOf("ALL") === -1) {
  console.log("Filter:");
  console.log("    Incoming data: " + tl.Certificates.length + " certificates");
  tl.filter(trustFilter);
  console.log("    Filtered data: " + tl.Certificates.length + " certificates");
}
switch ((commander_1.default.format || "pem").toLowerCase()) {
  case "js":
    console.log("Output format: JS");
    fs.writeFileSync(outputFile, JSON.stringify(tl), { flag: "w+" });
    break;
  case "pkijs":
    console.log("Output format: PKIJS");
    let _pkijs = jsonToPKIJS(tl.toJSON());
    fs.writeFileSync(outputFile, JSON.stringify(_pkijs), { flag: "w+" });
    break;
  case "pem":
    console.log("Output format: PEM");
    fs.writeFileSync(outputFile, tl.toString(), { flag: "w+" });
    break;
  case "files":
    {
      const crypto = crypto_1.pkijs.getCrypto();
      if (typeof crypto === "undefined") {
        console.log("Unable to initialize cryptographic engine");
        break;
      }
      let filesJSON = {};
      function storeFiles(directory, trustList) {
        let targetDir = `./roots/${directory}`;
        filesJSON[directory] = [];
        let PKICertificate = crypto_1.pkijs.Certificate;
        let files = [];
        let noIdFiles = [];
        for (let i = 0; i < trustList.Certificates.length; i++) {
          let fileRaw = pvutils.stringToArrayBuffer(
            pvutils.fromBase64(trustList.Certificates[i].raw)
          );
          let asn1 = crypto_1.asn1js.fromBER(fileRaw);
          if (asn1.offset === -1) continue;
          let certificate;
          try {
            certificate = new PKICertificate({ schema: asn1.result });
          } catch (ex) {
            continue;
          }
          let nameID = nodeCrypto
            .createHash("SHA1")
            .update(Buffer.from(certificate.subject.valueBeforeDecode))
            .digest()
            .toString("hex")
            .toUpperCase();
          if ("extensions" in certificate) {
            for (let j = 0; j < certificate.extensions.length; j++) {
              if (certificate.extensions[j].extnID === "2.5.29.14") {
                files.push({
                  name: pvutils.bufferToHexCodes(
                    certificate.extensions[j].parsedValue.valueBlock.valueHex
                  ),
                  nameID: nameID,
                  content: fileRaw.slice(0),
                });
                break;
              }
              noIdFiles.push({
                publicKey: certificate.subjectPublicKeyInfo.subjectPublicKey.valueBlock.valueHex.slice(
                  0
                ),
                nameID: nameID,
                content: fileRaw.slice(0),
              });
            }
          }
        }
        if (files.length || noIdFiles.length) {
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
        }
        if (files.length) {
          for (let k = 0; k < files.length; k++) {
            filesJSON[directory].push({
              k: files[k].name,
              n: files[k].nameID,
            });
            try {
              fs.writeFileSync(
                targetDir + "/" + files[k].name,
                Buffer.from(files[k].content)
              );
              filesJSON[directory].push({
                k: files[k].name,
                n: files[k].nameID,
              });
            } catch (err) {
              if (err.code !== "ENAMETOOLONG") {
                throw err;
              }
              console.log(err.message);
            }
          }
        }
        if (noIdFiles.length) {
          for (let m = 0; m < noIdFiles.length; m++) {
            let keyID = nodeCrypto
              .createHash("SHA1")
              .update(Buffer.from(noIdFiles[m].publicKey))
              .digest()
              .toString("hex")
              .toUpperCase();
            filesJSON[directory].push({
              k: keyID,
              n: noIdFiles[m].nameID,
            });
            fs.writeFileSync(
              targetDir + "/" + keyID,
              Buffer.from(noIdFiles[m].content)
            );
          }
        }
        fs.writeFileSync(
          "./roots/index.json",
          Buffer.from(JSON.stringify(filesJSON))
        );
      }
      if (!fs.existsSync("./roots")) fs.mkdirSync("./roots");
      if (mozTL) storeFiles("mozilla", mozTL);
      if (eutlTL) storeFiles("eutl", eutlTL);
      if (msTL) storeFiles("microsoft", msTL);
      if (appleTL) storeFiles("apple", appleTL);
      if (ciscoTL) storeFiles("cisco", ciscoTL);
    }
    break;
  default:
    console.log("Invalid output format");
    break;
}

module.exports = {
  getMicrosoftTrusted: parseMicrosoftTrusted,
};
