"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Apple = void 0;
const tslib_1 = require("tslib");
const sync_request_1 = tslib_1.__importDefault(require("sync-request"));
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const TrustedList = require("../tl");
class Apple {
  constructor({ url = Apple.URL, timeout = Apple.TIMEOUT } = {}) {
    this.url = url;
    this.timeout = timeout;
  }
  getTrusted(
    dataTlList,
    dataCertList,
    dataEvRoots,
    skipFetch = false,
    {} = {}
  ) {
    let tl = new TrustedList();
    let tlVersion = this.getLatestVersion(dataTlList);
    let certNames = this.getTrustedCertList(tlVersion, dataCertList);
    let evRoots = this.getEVOIDList(tlVersion, dataEvRoots);
    if (skipFetch === false) process.stdout.write("Fetching certificates");
    for (let certName of certNames) {
      let certRaw = "";
      let evPolicies = [];
      if (skipFetch === false) process.stdout.write(".");
      if (skipFetch === false)
        certRaw = this.getTrustedCert(tlVersion, certName);
      if (certName in evRoots) evPolicies = evRoots[certName];
      let tl_cert = {
        raw: certRaw,
        trust: ["ANY"],
        operator: decodeURI(certName.slice(0, -4)),
        source: "Apple",
        evpolicy: evPolicies,
      };
      tl.AddCertificate(tl_cert);
    }
    if (skipFetch === false) console.log();
    return tl;
  }
  getDisallowed(dataTlList, dataDisCertList, skipFetch = false) {
    let tl = new TrustedList();
    let tlVersion = this.getLatestVersion(dataTlList);
    let certNames = this.getDistrustedCertList(tlVersion, dataDisCertList);
    if (skipFetch === false) process.stdout.write("Fetching certificates");
    for (let certName of certNames) {
      let certRaw = "";
      let evPolicies = [];
      if (skipFetch === false) process.stdout.write(".");
      if (skipFetch === false)
        certRaw = this.getDistrustedCert(tlVersion, certName);
      let tl_cert = {
        raw: certRaw,
        trust: ["ANY"],
        operator: decodeURI(certName.slice(0, -4)),
        source: "Apple",
        evpolicy: evPolicies,
      };
      tl.AddCertificate(tl_cert);
    }
    if (skipFetch === false) console.log();
    return tl;
  }
  getLatestVersion(data = "") {
    if (!data) {
      let res = sync_request_1.default("GET", this.url, {
        timeout: 10000,
        retry: true,
        headers: { "user-agent": "nodejs" },
      });
      data = res.body.toString();
    }
    let ch = cheerio_1.default.load(data);
    let verStr = "";
    let verNum = -1;
    ch("td")
      .has("img")
      .find("a")
      .each((i, anchor) => {
        let href = anchor.attribs["href"];
        if (href.startsWith("security_certificates-")) {
          let linkVer = href
            .replace(/^security_certificates-/, "")
            .replace(/\/*$/, "");
          let linkArr = linkVer.split(".");
          let linkNum = parseInt(linkArr[0]) * 1000000;
          if (linkArr.length > 1) linkNum += parseInt(linkArr[1]) * 1000;
          if (linkArr.length > 2) linkNum += parseInt(linkArr[2]);
          if (linkNum > verNum) {
            verStr = linkVer;
            verNum = linkNum;
          }
        }
      });
    return verStr;
  }
  getTrustedCertList(version, data = "") {
    if (!data) {
      let url =
        this.url + "security_certificates-" + version + "/certificates/roots/";
      let res = sync_request_1.default("GET", url, {
        timeout: this.timeout,
        retry: true,
        headers: { "user-agent": "nodejs" },
      });
      data = res.body.toString();
    }
    let ch = cheerio_1.default.load(data);
    let filenames = [];
    ch("td")
      .has("img")
      .find("a")
      .each(function (i, anchor) {
        let href = anchor.attribs["href"];
        if (
          href.endsWith("/certificates/") ||
          href.endsWith("/../") ||
          href === "AppleDEVID.cer"
        )
          return;
        filenames.push(href);
      });
    return filenames;
  }
  getDistrustedCertList(version, data = "") {
    if (!data) {
      let url =
        this.url +
        "security_certificates-" +
        version +
        "/certificates/distrusted/";
      let res = sync_request_1.default("GET", url, {
        timeout: this.timeout,
        retry: true,
        headers: { "user-agent": "nodejs" },
      });
      data = res.body.toString();
    }
    let ch = cheerio_1.default.load(data);
    let filenames = [];
    ch("td")
      .has("img")
      .find("a")
      .each(function (i, anchor) {
        let href = anchor.attribs["href"];
        if (href.endsWith("/certificates/") || href.endsWith("/../")) return;
        filenames.push(href);
      });
    return filenames;
  }
  getEVOIDList(version, data = "") {
    if (!data) {
      let url =
        this.url +
        "security_certificates-" +
        version +
        "/certificates/evroot.config?txt";
      let res = sync_request_1.default("GET", url, {
        timeout: this.timeout,
        retry: true,
        headers: { "user-agent": "nodejs" },
      });
      data = res.body.toString();
    }
    let evRoots = {};
    let lines = data.split("\n").filter((v) => {
      if (v === "" || v.indexOf("#") === 0) return false;
      else return true;
    });
    for (let line of lines) {
      let lineSpl = this.splitLine(line);
      for (let cert of lineSpl.splice(1)) {
        cert = cert.replace(/"/g, "");
        if (cert in evRoots) evRoots[cert].push(lineSpl[0]);
        else evRoots[cert] = [lineSpl[0]];
      }
    }
    return evRoots;
  }
  getTrustedCert(version, filename) {
    let url =
      this.url +
      "security_certificates-" +
      version +
      "/certificates/roots/" +
      filename;
    let res = sync_request_1.default("GET", url, {
      timeout: this.timeout,
      retry: true,
      headers: { "user-agent": "nodejs" },
    });
    return res.body.toString("base64");
  }
  getDistrustedCert(version, filename) {
    let url =
      this.url +
      "security_certificates-" +
      version +
      "/certificates/distrusted/" +
      filename;
    let res = sync_request_1.default("GET", url, {
      timeout: this.timeout,
      retry: true,
      headers: { "user-agent": "nodejs" },
    });
    return res.body.toString("base64");
  }
  splitLine(line) {
    let re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^ '"\s\\]*(?:\s+[^ '"\s\\]+)*))\s*(?: |$)/g;
    let a = [];
    line.replace(re_value, function (m0, m1, m2, m3) {
      if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
      else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
      else if (m3 !== undefined) a.push(m3);
      return "";
    });
    return a;
  }
}
module.exports = Apple;
Apple.URL = "https://opensource.apple.com/source/security_certificates/";
Apple.TIMEOUT = 1e4;
