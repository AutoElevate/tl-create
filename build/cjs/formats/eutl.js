"use strict";
var _element;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustServiceStatusList = exports.XmlNodeType = exports.EUTL = void 0;
const tslib_1 = require("tslib");
const XmlCore = tslib_1.__importStar(require("xml-core"));
const XmlDSigJs = tslib_1.__importStar(require("xmldsigjs"));
const XAdES = tslib_1.__importStar(require("xadesjs"));
const sync_request_1 = tslib_1.__importDefault(require("sync-request"));
const TrustedList = require("../tl");
const crypto_1 = require("../crypto");
XAdES.Application.setEngine("@peculiar/webcrypto", crypto_1.crypto);
class EUTL {
  constructor({ url = EUTL.URL, timeout = EUTL.TIMEOUT } = {}) {
    this.TrustServiceStatusLists = [];
    this.url = url;
    this.timeout = timeout;
  }
  loadTSL(data) {
    let eutl = new TrustServiceStatusList();
    let xml = XAdES.Parse(data);
    eutl.LoadXml(xml);
    return eutl;
  }
  fetchAllTSLs() {
    var _a;
    let toProcess = [this.url];
    let processed = [];
    this.TrustServiceStatusLists = [];
    while (toProcess.length !== 0) {
      let url = toProcess.pop();
      processed.push(url);
      let res;
      let tlsBody;
      try {
        res = sync_request_1.default("GET", url, {
          timeout: this.timeout,
          retry: true,
          headers: { "user-agent": "nodejs" },
        });
        tlsBody = res.getBody("utf8");
      } catch (ex) {
        continue;
      }
      let eutl = this.loadTSL(tlsBody);
      this.TrustServiceStatusLists.push(eutl);
      for (let pointer of eutl.SchemaInformation.Pointers) {
        if (
          ((_a = pointer.AdditionalInformation) === null || _a === void 0
            ? void 0
            : _a.MimeType) === "application/vnd.etsi.tsl+xml" &&
          processed.indexOf(pointer.Location) === -1
        )
          toProcess.push(pointer.Location);
      }
    }
  }
  getTrusted(data) {
    var _a;
    if (data) {
      this.TrustServiceStatusLists = [this.loadTSL(data)];
    } else {
      this.fetchAllTSLs();
    }
    let tl = new TrustedList();
    for (let TrustServiceStatusList of this.TrustServiceStatusLists) {
      for (let trustServiceProvider of TrustServiceStatusList.TrustServiceProviders) {
        for (let tSPService of trustServiceProvider.TSPServices) {
          for (let cert of tSPService.X509Certificates) {
            tl.AddCertificate({
              raw: cert,
              trust: [tSPService.ServiceTypeIdentifier],
              operator:
                (_a = trustServiceProvider.TSPName) === null || _a === void 0
                  ? void 0
                  : _a.GetItem("en"),
              source: "EUTL",
              evpolicy: [],
            });
          }
        }
      }
    }
    return tl;
  }
}
module.exports = EUTL;
EUTL.URL =
  "https://ec.europa.eu/information_society/policy/esignature/trusted-list/tl-mp.xml";
EUTL.TIMEOUT = 1e4;
exports.XmlNodeType = XmlCore.XmlNodeType;
class XmlObject {
  GetAttribute(node, name, defaultValue = null) {
    return node.hasAttribute(name) ? node.getAttribute(name) : defaultValue;
  }
  NextElementPos(nl, pos, name, ns, required) {
    while (pos < nl.length) {
      const node = nl[pos];
      if (XmlCore.isElement(node)) {
        if (node.localName !== name || node.namespaceURI !== ns) {
          if (required) throw new Error(`Malformed element '${name}'`);
          else return -2;
        } else return pos;
      } else pos++;
    }
    if (required) throw new Error(`Malformed element '${name}'`);
    return -1;
  }
}
let XmlTrustServiceStatusList = {
  ElementNames: {
    TrustServiceStatusList: "TrustServiceStatusList",
    SchemeInformation: "SchemeInformation",
    TSLVersionIdentifier: "TSLVersionIdentifier",
    TSLSequenceNumber: "TSLSequenceNumber",
    TSLType: "TSLType",
    SchemeOperatorName: "SchemeOperatorName",
    Name: "Name",
    SchemeOperatorAddress: "SchemeOperatorAddress",
    PostalAddresses: "PostalAddresses",
    PostalAddress: "PostalAddress",
    StreetAddress: "StreetAddress",
    Locality: "Locality",
    PostalCode: "PostalCode",
    CountryName: "CountryName",
    ElectronicAddress: "ElectronicAddress",
    URI: "URI",
    SchemeName: "SchemeName",
    SchemeInformationURI: "SchemeInformationURI",
    StatusDeterminationApproach: "StatusDeterminationApproach",
    SchemeTypeCommunityRules: "SchemeTypeCommunityRules",
    SchemeTerritory: "SchemeTerritory",
    PolicyOrLegalNotice: "PolicyOrLegalNotice",
    TSLLegalNotice: "TSLLegalNotice",
    HistoricalInformationPeriod: "HistoricalInformationPeriod",
    PointersToOtherTSL: "PointersToOtherTSL",
    OtherTSLPointer: "OtherTSLPointer",
    ServiceDigitalIdentities: "ServiceDigitalIdentities",
    ServiceDigitalIdentity: "ServiceDigitalIdentity",
    DigitalId: "DigitalId",
    X509Certificate: "X509Certificate",
    TSLLocation: "TSLLocation",
    AdditionalInformation: "AdditionalInformation",
    OtherInformation: "OtherInformation",
    ListIssueDateTime: "ListIssueDateTime",
    NextUpdate: "NextUpdate",
    dateTime: "dateTime",
    DistributionPoints: "DistributionPoints",
    MimeType: "MimeType",
    TrustServiceProviderList: "TrustServiceProviderList",
    TrustServiceProvider: "TrustServiceProvider",
    TSPName: "TSPName",
    TSPService: "TSPService",
    ServiceTypeIdentifier: "ServiceTypeIdentifier",
  },
  AttributeNames: {
    Id: "Id",
    TSLTag: "TSLTag",
  },
  NamespaceURI: "http://uri.etsi.org/02231/v2#",
};
class TrustServiceStatusList extends XmlObject {
  constructor() {
    super(...arguments);
    _element.set(this, null);
    this.Id = null;
    this.TSLTag = null;
    this.TrustServiceProviders = [];
  }
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (XmlCore.isDocument(value)) value = value.documentElement;
    if (!XmlCore.isElement(value)) {
      throw new Error(`Argument 'value' must be XML Element`);
    }
    if (
      value.localName ===
        XmlTrustServiceStatusList.ElementNames.TrustServiceStatusList &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      this.Id = this.GetAttribute(
        value,
        XmlTrustServiceStatusList.AttributeNames.Id
      );
      this.TSLTag = this.GetAttribute(
        value,
        XmlTrustServiceStatusList.AttributeNames.TSLTag
      );
      this.SchemaInformation = new SchemeInformation();
      let i = this.NextElementPos(
        value.childNodes,
        0,
        XmlTrustServiceStatusList.ElementNames.SchemeInformation,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.SchemaInformation.LoadXml(value.childNodes[i]);
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.TrustServiceProviderList,
        XmlTrustServiceStatusList.NamespaceURI,
        false
      );
      if (i > 0) {
        let el = value.childNodes[i];
        let TrustServiceProviderNodes = el.getElementsByTagNameNS(
          XmlTrustServiceStatusList.NamespaceURI,
          XmlTrustServiceStatusList.ElementNames.TrustServiceProvider
        );
        for (let i = 0; i < TrustServiceProviderNodes.length; i++) {
          let TrustServiceProviderNode = TrustServiceProviderNodes[i];
          let trustServiceProvider = new TrustServiceProvider();
          trustServiceProvider.LoadXml(TrustServiceProviderNode);
          this.TrustServiceProviders.push(trustServiceProvider);
        }
      }
      tslib_1.__classPrivateFieldSet(this, _element, value);
    } else throw new Error("Wrong XML element");
  }
  CheckSignature() {
    if (!tslib_1.__classPrivateFieldGet(this, _element)) {
      throw new Error("Null reference exception. Property '#element' is null");
    }
    let xmlSignature = tslib_1
      .__classPrivateFieldGet(this, _element)
      .getElementsByTagNameNS(XmlDSigJs.XmlSignature.NamespaceURI, "Signature");
    let sxml = new XAdES.SignedXml(
      tslib_1.__classPrivateFieldGet(this, _element).ownerDocument
    );
    sxml.LoadXml(xmlSignature[0]);
    return sxml.Verify();
  }
}
exports.TrustServiceStatusList = TrustServiceStatusList;
_element = new WeakMap();
class SchemeInformation extends XmlObject {
  constructor() {
    super(...arguments);
    this.Version = 0;
    this.SequenceNumber = 0;
    this.Type = "";
    this.StatusDeterminationApproach = "";
    this.SchemeTerritory = "";
    this.HistoricalInformationPeriod = 0;
    this.Pointers = [];
  }
  LoadXml(value) {
    var _a, _b;
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName ===
        XmlTrustServiceStatusList.ElementNames.SchemeInformation &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let i = this.NextElementPos(
        value.childNodes,
        0,
        XmlTrustServiceStatusList.ElementNames.TSLVersionIdentifier,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.Version = +((_a = value.childNodes[i].textContent) !== null &&
      _a !== void 0
        ? _a
        : 0);
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.TSLSequenceNumber,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.SequenceNumber = +((_b = value.childNodes[i].textContent) !== null &&
      _b !== void 0
        ? _b
        : 0);
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.TSLType,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.Type = value.childNodes[i].textContent;
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.SchemeOperatorName,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.SchemeOperatorAddress,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.SchemeName,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.SchemeInformationURI,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.StatusDeterminationApproach,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.StatusDeterminationApproach = value.childNodes[i].textContent;
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.SchemeTypeCommunityRules,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.SchemeTerritory,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.StatusDeterminationApproach = value.childNodes[i].textContent;
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.PolicyOrLegalNotice,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.HistoricalInformationPeriod,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.HistoricalInformationPeriod = +value.childNodes[i].textContent;
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.PointersToOtherTSL,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      let pointers = value.childNodes[i].childNodes;
      for (let j = 0; j < pointers.length; j++) {
        let node = pointers[j];
        if (node.nodeType !== exports.XmlNodeType.Element) continue;
        let pointer = new Pointer();
        pointer.LoadXml(node);
        this.Pointers.push(pointer);
      }
    } else throw new Error("Wrong XML element");
  }
}
class Pointer extends XmlObject {
  constructor() {
    super(...arguments);
    this.Location = null;
    this.X509Certificates = [];
    this.AdditionalInformation = null;
  }
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName ===
        XmlTrustServiceStatusList.ElementNames.OtherTSLPointer &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let i = this.NextElementPos(
        value.childNodes,
        0,
        XmlTrustServiceStatusList.ElementNames.ServiceDigitalIdentities,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      let serviceDigitalIdentities = value.childNodes[i].childNodes;
      for (let j = 0; j < serviceDigitalIdentities.length; j++) {
        if (
          serviceDigitalIdentities[j].nodeType !== exports.XmlNodeType.Element
        )
          continue;
        let elsX509 = serviceDigitalIdentities[j].getElementsByTagNameNS(
          XmlTrustServiceStatusList.NamespaceURI,
          XmlTrustServiceStatusList.ElementNames.X509Certificate
        );
        for (let k = 0; k < elsX509.length; k++)
          this.X509Certificates.push(elsX509[k].textContent);
      }
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.TSLLocation,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.Location = value.childNodes[i].textContent;
      i = this.NextElementPos(
        value.childNodes,
        ++i,
        XmlTrustServiceStatusList.ElementNames.AdditionalInformation,
        XmlTrustServiceStatusList.NamespaceURI,
        true
      );
      this.AdditionalInformation = new AdditionalInformation();
      this.AdditionalInformation.LoadXml(value.childNodes[i]);
    } else throw new Error("Wrong XML element");
  }
}
class AdditionalInformation extends XmlObject {
  constructor() {
    super(...arguments);
    this.TSLType = null;
    this.SchemeTerritory = null;
    this.SchemeOperatorName = new SchemeOperatorName();
    this.SchemeTypeCommunityRules = [];
    this.MimeType = null;
  }
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName ===
        XmlTrustServiceStatusList.ElementNames.AdditionalInformation &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let OtherInformationList = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.OtherInformation
      );
      for (let i = 0; i < OtherInformationList.length; i++) {
        let node = this.GetFirstElement(OtherInformationList[i].childNodes);
        if (XmlCore.isElement(node)) {
          switch (node.localName) {
            case XmlTrustServiceStatusList.ElementNames.SchemeTerritory:
              this.SchemeTerritory = node.textContent;
              break;
            case XmlTrustServiceStatusList.ElementNames.TSLType:
              this.TSLType = node.textContent;
              break;
            case XmlTrustServiceStatusList.ElementNames.SchemeOperatorName:
              this.SchemeOperatorName.LoadXml(node);
              break;
            case XmlTrustServiceStatusList.ElementNames
              .SchemeTypeCommunityRules:
              let elements = node.getElementsByTagNameNS(
                XmlTrustServiceStatusList.NamespaceURI,
                XmlTrustServiceStatusList.ElementNames.URI
              );
              for (let j = 0; j < elements.length; j++) {
                this.SchemeTypeCommunityRules.push(elements[j].textContent);
              }
              break;
            case XmlTrustServiceStatusList.ElementNames.MimeType:
              this.MimeType = node.textContent;
              break;
          }
        }
      }
    } else throw new Error("Wrong XML element");
  }
  GetFirstElement(nl) {
    for (let i = 0; i < nl.length; i++) {
      let node = nl[i];
      if (node.nodeType !== exports.XmlNodeType.Element) continue;
      return node;
    }
    return null;
  }
}
class MultiLangType extends XmlObject {
  constructor() {
    super(...arguments);
    this.m_elements = [];
  }
  GetItem(lang) {
    for (let item of this.m_elements) {
      if ((item.lang = lang)) return item.item;
    }
    return null;
  }
  GetLang(el) {
    let lang = this.GetAttribute(el, "xml:lang");
    return lang || null;
  }
  AddItem(el, lang) {
    this.m_elements.push({ item: el, lang: lang });
  }
}
class SchemeOperatorName extends MultiLangType {
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName ===
        XmlTrustServiceStatusList.ElementNames.SchemeOperatorName &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let elements = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.Name
      );
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let lang = this.GetLang(element);
        if (!lang)
          throw new Error("SchemeOperatorName:Name has no xml:lang attribute");
        this.AddItem(element.textContent, lang);
      }
    } else throw new Error("Wrong XML element");
  }
}
class TrustServiceProvider extends XmlObject {
  constructor() {
    super(...arguments);
    this.TSPName = null;
    this.TSPServices = [];
  }
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName ===
        XmlTrustServiceStatusList.ElementNames.TrustServiceProvider &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let TSPNameNodes = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.TSPName
      );
      if (TSPNameNodes.length > 0) {
        this.TSPName = new TSPName();
        this.TSPName.LoadXml(TSPNameNodes[0]);
      }
      let TSPServiceNodes = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.TSPService
      );
      for (let i = 0; i < TSPServiceNodes.length; i++) {
        let TSPServiceNode = TSPServiceNodes[i];
        let tSPService = new TSPService();
        tSPService.LoadXml(TSPServiceNode);
        this.TSPServices.push(tSPService);
      }
    } else throw new Error("Wrong XML element");
  }
}
class TSPService extends XmlObject {
  constructor() {
    super(...arguments);
    this.X509Certificates = [];
    this.ServiceTypeIdentifier = null;
  }
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName === XmlTrustServiceStatusList.ElementNames.TSPService &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let ServiceTypeIdentifierNodes = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.ServiceTypeIdentifier
      );
      if (ServiceTypeIdentifierNodes.length > 0)
        this.ServiceTypeIdentifier = ServiceTypeIdentifierNodes[0].textContent;
      let DigitalIdNodes = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.DigitalId
      );
      for (let i = 0; i < DigitalIdNodes.length; i++) {
        let DigitalId = DigitalIdNodes[i];
        let X509CertificateNodes = DigitalId.getElementsByTagNameNS(
          XmlTrustServiceStatusList.NamespaceURI,
          XmlTrustServiceStatusList.ElementNames.X509Certificate
        );
        for (let j = 0; j < X509CertificateNodes.length; j++) {
          this.X509Certificates.push(X509CertificateNodes[j].textContent);
        }
      }
    } else throw new Error("Wrong XML element");
  }
}
class TSPName extends MultiLangType {
  LoadXml(value) {
    if (value == null) throw new Error("Parameter 'value' is required");
    if (
      value.localName === XmlTrustServiceStatusList.ElementNames.TSPName &&
      value.namespaceURI === XmlTrustServiceStatusList.NamespaceURI
    ) {
      let elements = value.getElementsByTagNameNS(
        XmlTrustServiceStatusList.NamespaceURI,
        XmlTrustServiceStatusList.ElementNames.Name
      );
      for (let i = 0; i < elements.length; i++) {
        let element = elements[i];
        let lang = this.GetLang(element);
        if (!lang) throw new Error("TSPName:Name has no xml:lang attribute");
        this.AddItem(element.textContent, lang);
      }
    } else throw new Error("Wrong XML element");
  }
}
