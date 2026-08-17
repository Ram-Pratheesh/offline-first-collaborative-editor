export interface ChangeEvent {
    userId: string;
    userName: string;
    timestamp: string;
    changeType: 'insert' | 'delete' | 'format' | 'restructure';
    affectedContent: string;
    section?: string;
}
export interface ChangeSummary {
    summary: string;
    contributorChanges: {
        userName: string;
        changes: string[];
    }[];
    importantAdditions: string[];
    removedContent: string[];
    noEditsLost: boolean;
    totalEdits: number;
}
export declare const generateChangeSummary: (changes: ChangeEvent[], documentTitle: string) => Promise<ChangeSummary>;
interface TrackedUserChange {
    userName: string;
    insertedText: string;
    deletedText: string;
    offlineText: string;
}
export declare const generateTrackedChangeSummary: (perUserChanges: TrackedUserChange[], documentTitle: string) => Promise<ChangeSummary>;
export declare const generateDocumentSummary: (content: string, title: string) => Promise<string>;
export {};
//# sourceMappingURL=aiService.d.ts.map