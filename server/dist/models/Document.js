import mongoose, { Schema } from 'mongoose';
const collaboratorSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    permission: {
        type: String,
        enum: ['editor', 'viewer'],
        default: 'editor',
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false });
const versionSchema = new Schema({
    content: {
        type: String,
        default: '',
    },
    editor: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    summary: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});
const documentSchema = new Schema({
    title: {
        type: String,
        default: 'Untitled Document',
        trim: true,
        maxlength: 200,
    },
    content: {
        type: String,
        default: '',
    },
    icon: {
        type: String,
        default: '📄',
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    collaborators: [collaboratorSchema],
    isStarredBy: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    versions: [versionSchema],
    yjsState: {
        type: Buffer,
        default: null,
    },
    lastEditedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
documentSchema.index({ owner: 1, isDeleted: 1 });
documentSchema.index({ 'collaborators.user': 1, isDeleted: 1 });
documentSchema.index({ title: 'text', content: 'text' });
export const DocumentModel = mongoose.model('Document', documentSchema);
//# sourceMappingURL=Document.js.map