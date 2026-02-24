export interface ContactFormState {
    isFormEnabled: boolean;
    address: string;
    phones: string[];
    emails: string[];
    recipientEmails: string[];
    mapEmbedUrl: string;
    successMessage: string;
    selectedKvkkId: string;
}
