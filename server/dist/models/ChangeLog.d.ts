import mongoose, { Document } from 'mongoose';
export interface IChangeLog extends Document {
    documentId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    userName: string;
    changeType: 'insert' | 'delete';
    content: string;
    timestamp: Date;
    isOffline: boolean;
}
export declare const ChangeLogModel: mongoose.Model<IChangeLog, {}, {}, {}, mongoose.Document<unknown, {}, IChangeLog, {}, {}> & IChangeLog & Required<{
    _id: mongoose.Types.ObjectId;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=ChangeLog.d.ts.map