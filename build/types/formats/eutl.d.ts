import * as XmlCore from "xml-core";
import { TrustedList } from "../tl";
export interface EUTLParameters {
    url?: string;
    timeout?: number;
}
export declare class EUTL {
    static URL: string;
    static TIMEOUT: number;
    TrustServiceStatusLists: TrustServiceStatusList[];
    url: string;
    timeout: number;
    constructor({ url, timeout, }?: EUTLParameters);
    loadTSL(data: string): TrustServiceStatusList;
    fetchAllTSLs(): void;
    getTrusted(data?: string): TrustedList;
}
export declare let XmlNodeType: typeof XmlCore.XmlNodeType;
declare abstract class XmlObject {
    protected GetAttribute(node: Element, name: string, defaultValue?: string | null): string | null;
    protected NextElementPos(nl: NodeList, pos: number, name: string, ns: string, required: boolean): number;
}
export declare class TrustServiceStatusList extends XmlObject {
    #private;
    Id: string | null;
    TSLTag: string | null;
    SchemaInformation: SchemeInformation;
    TrustServiceProviders: TrustServiceProvider[];
    LoadXml(value: Node): void;
    CheckSignature(): Promise<boolean>;
}
declare class SchemeInformation extends XmlObject {
    Version: number;
    SequenceNumber: number;
    Type: string;
    StatusDeterminationApproach: string;
    SchemeTerritory: string;
    HistoricalInformationPeriod: number;
    Pointers: Pointer[];
    LoadXml(value: Element): void;
}
declare class Pointer extends XmlObject {
    Location: string | null;
    X509Certificates: string[];
    AdditionalInformation: AdditionalInformation | null;
    LoadXml(value: Element): void;
}
declare class AdditionalInformation extends XmlObject {
    TSLType: string | null;
    SchemeTerritory: string | null;
    SchemeOperatorName: SchemeOperatorName;
    SchemeTypeCommunityRules: string[];
    MimeType: string | null;
    LoadXml(value: Element): void;
    protected GetFirstElement(nl: NodeList): Node | null;
}
interface MultiLangItem<T> {
    item: T;
    lang: string;
}
declare class MultiLangType<T> extends XmlObject {
    protected m_elements: MultiLangItem<T>[];
    GetItem(lang: string): T | null;
    protected GetLang(el: Element): string | null;
    AddItem(el: T, lang: string): void;
}
declare class SchemeOperatorName extends MultiLangType<string> {
    LoadXml(value: Element): void;
}
declare class TrustServiceProvider extends XmlObject {
    TSPName: TSPName | null;
    TSPServices: TSPService[];
    LoadXml(value: Element): void;
}
declare class TSPService extends XmlObject {
    X509Certificates: string[];
    ServiceTypeIdentifier: string | null;
    LoadXml(value: Element): void;
}
declare class TSPName extends MultiLangType<string> {
    LoadXml(value: Element): void;
}
export {};
