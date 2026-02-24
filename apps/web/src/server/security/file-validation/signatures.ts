export const FILE_SIGNATURES = {
    PDF: [
        Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
    ],
    DOC: [
        Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]), // DOC (OLE2)
    ],
    DOCX: [
        Buffer.from([0x50, 0x4B, 0x03, 0x04]), // DOCX (ZIP-based)
        Buffer.from([0x50, 0x4B, 0x05, 0x06]), // DOCX (empty ZIP)
        Buffer.from([0x50, 0x4B, 0x07, 0x08]), // DOCX (spanned ZIP)
    ],
} as const;

export const PDF_TRAILER_SIGNATURES = [
    Buffer.from('%%EOF'),
    Buffer.from('%EOF'),
];

export const ZIP_SIGNATURES = [
    Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    Buffer.from([0x50, 0x4B, 0x05, 0x06]),
    Buffer.from([0x50, 0x4B, 0x07, 0x08]),
];

const EICAR_TEST_SIGNATURE = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
export const KNOWN_MALWARE_SIGNATURES = [
    Buffer.from(EICAR_TEST_SIGNATURE, "utf8"),
] as const;
