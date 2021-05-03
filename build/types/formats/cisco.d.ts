import { TrustedList } from "../tl";
export interface CiscoParameters {
    url?: string;
    timeout?: number;
}
export declare class Cisco {
    static URL: string;
    static TIMEOUT: number;
    url: string;
    timeout: number;
    fetchurl: string;
    source: string;
    signedData: any;
    constructor(store?: string, { url, timeout, }?: CiscoParameters);
    getTrusted(data?: string): TrustedList;
    getDisallowed(data?: string): TrustedList;
    verifyP7(): Promise<any>;
}
