import { TrustedList, X509Certificate } from "../tl";
declare type MozillaAttribute = {
    name: string;
    type: string;
    value: any;
};
export interface MozillaParameters {
    url?: string;
    timeout?: number;
}
export declare class Mozilla {
    static URL: string;
    static TIMEOUT: number;
    url: string;
    timeout: number;
    protected attributes: any[];
    protected certText: string[] | null;
    protected curIndex: number;
    protected codeFilterList: string[];
    constructor(codeFilter?: string[], { url, timeout, }?: MozillaParameters);
    getTrusted(data?: string): TrustedList;
    getDisallowed(data?: string): TrustedList;
    getByTrustValue(data?: string, trustVal?: string): TrustedList;
    protected findNcc(cert: any, nccs: any[]): any;
    protected findObjectDefinitionsSegment(): void;
    protected findTrustSegment(): void;
    protected findBeginDataSegment(): void;
    protected findClassSegment(): void;
    protected findSegment(name: string): void;
    protected getValue(type: string, value?: string[]): any;
    protected getAttribute(row: string): MozillaAttribute | null;
    protected parseListItem(): any;
    emptyTrustFilter(item: X509Certificate, index: number): boolean;
}
export {};
