export interface X509Certificate {
    raw: string;
    operator?: string;
    trust?: string[];
    source?: string;
    evpolicy?: string[];
    thumbprint?: string;
}
export declare type ExportX509CertificateJSON = X509Certificate[];
export declare class TrustedList {
    protected m_certificates: X509Certificate[];
    get Certificates(): X509Certificate[];
    AddCertificate(cert: X509Certificate): void;
    toJSON(): ExportX509CertificateJSON;
    concat(tl: TrustedList): TrustedList;
    filter(callbackfn: (value: X509Certificate, index: number, array: X509Certificate[]) => boolean, thisArg?: any): TrustedList;
    toString(): string;
}
