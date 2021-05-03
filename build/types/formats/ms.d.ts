/// <reference types="node" />
import { TrustedList } from "../tl";
export declare class Microsoft {
    getTrusted(data?: string, skipFetch?: boolean): TrustedList;
    getDisallowed(data?: string, skipFetch?: boolean): TrustedList;
    fetchcert(certid: string): string;
    fetchSTL(uri: string, filename: string): Buffer;
}
