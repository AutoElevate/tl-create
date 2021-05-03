import { TrustedList } from "../tl";
interface IEVOID {
    [key: string]: string[];
}
export interface AppleParameters {
    url?: string;
    timeout?: number;
}
export declare class Apple {
    static URL: string;
    static TIMEOUT: number;
    url: string;
    timeout: number;
    constructor({ url, timeout, }?: AppleParameters);
    getTrusted(dataTlList?: string, dataCertList?: string, dataEvRoots?: string, skipFetch?: boolean, {}?: AppleParameters): TrustedList;
    getDisallowed(dataTlList?: string, dataDisCertList?: string, skipFetch?: boolean): TrustedList;
    getLatestVersion(data?: string): string;
    getTrustedCertList(version: string, data?: string): string[];
    getDistrustedCertList(version: string, data?: string): string[];
    getEVOIDList(version: string, data?: string): IEVOID;
    getTrustedCert(version: string, filename: string): string;
    getDistrustedCert(version: string, filename: string): string;
    splitLine(line: string): string[];
}
export {};
