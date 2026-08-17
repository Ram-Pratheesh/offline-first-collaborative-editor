import mongoose, { Document } from 'mongoose';
export interface ICollaborator {
    user: mongoose.Types.ObjectId;
    permission: 'editor' | 'viewer';
    addedAt: Date;
}
export interface IVersion {
    _id: mongoose.Types.ObjectId;
    content: string;
    editor: mongoose.Types.ObjectId;
    summary: string;
    createdAt: Date;
}
export interface IDocument extends Document {
    _id: mongoose.Types.ObjectId;
    title: string;
    content: string;
    icon: string;
    owner: mongoose.Types.ObjectId;
    collaborators: ICollaborator[];
    isStarredBy: mongoose.Types.ObjectId[];
    versions: IVersion[];
    yjsState: Buffer | null;
    lastEditedBy: mongoose.Types.ObjectId;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export declare const DocumentModel: mongoose.Model<IDocument, {}, {}, {}, mongoose.Document<unknown, {}, IDocument, {}, {}> & IDocument & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Document.d.ts.map