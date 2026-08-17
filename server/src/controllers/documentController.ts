import { Response } from 'express';
import { z } from 'zod';
import { DocumentModel } from '../models/Document.js';
import { User } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';

const createDocSchema = z.object({
  title: z.string().max(200).optional(),
  icon: z.string().optional(),
});

const shareDocSchema = z.object({
  email: z.string().email(),
  permission: z.enum(['editor', 'viewer']).default('editor'),
});

export const createDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = createDocSchema.safeParse(req.body);
    const data = validation.success ? validation.data : {};

    const doc = await DocumentModel.create({
      title: data.title || 'Untitled Document',
      icon: data.icon || '📄',
      owner: req.user!._id,
      lastEditedBy: req.user!._id,
      versions: [
        {
          content: '',
          editor: req.user!._id,
          summary: 'Document created',
        },
      ],
    });

    const populated = await doc.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'lastEditedBy', select: 'name email avatar' },
    ]);

    res.status(201).json({ document: populated });
  } catch (error) {
    console.error('❌ Error creating document:', error);
    res.status(500).json({ message: 'Failed to create document' });
  }
};

export const getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { search, filter } = req.query;

    let query: any = {
      isDeleted: false,
      $or: [
        { owner: userId },
        { 'collaborators.user': userId },
      ],
    };

    if (search && typeof search === 'string') {
      query.$and = [{ $text: { $search: search } }];
    }

    if (filter === 'starred') {
      query.isStarredBy = userId;
    } else if (filter === 'shared') {
      query = {
        isDeleted: false,
        'collaborators.user': userId,
      };
    } else if (filter === 'owned') {
      query = {
        isDeleted: false,
        owner: userId,
      };
    }

    const documents = await DocumentModel.find(query)
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .select('-yjsState -versions')
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
};

export const getDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    })
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .select('-yjsState');

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Auto-add as collaborator if accessing via link (not already owner/collaborator)
    const userId = req.user!._id.toString();
    const isOwner = doc.owner._id.toString() === userId;
    const isCollaborator = doc.collaborators.some(
      (c) => c.user._id.toString() === userId
    );

    if (!isOwner && !isCollaborator) {
      // Add as collaborator in the database
      await DocumentModel.findByIdAndUpdate(req.params.id, {
        $push: {
          collaborators: {
            user: req.user!._id,
            permission: 'editor',
            addedAt: new Date(),
          },
        },
      });
      // Re-fetch to get populated data
      const updated = await DocumentModel.findById(req.params.id)
        .populate('owner', 'name email avatar')
        .populate('collaborators.user', 'name email avatar')
        .populate('lastEditedBy', 'name email avatar')
        .select('-yjsState');
      res.json({ document: updated });
      return;
    }

    res.json({ document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch document' });
  }
};

export const updateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, icon, content } = req.body;
    const updates: any = { lastEditedBy: req.user!._id };
    if (title !== undefined) updates.title = title;
    if (icon !== undefined) updates.icon = icon;
    if (content !== undefined) updates.content = content;

    const doc = await DocumentModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
        $or: [
          { owner: req.user!._id },
          {
            'collaborators.user': req.user!._id,
            'collaborators.permission': 'editor',
          },
        ],
      },
      updates,
      { new: true }
    )
      .populate('owner', 'name email avatar')
      .populate('collaborators.user', 'name email avatar')
      .populate('lastEditedBy', 'name email avatar')
      .select('-yjsState');

    if (!doc) {
      res.status(404).json({ message: 'Document not found or access denied' });
      return;
    }

    res.json({ document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update document' });
  }
};

export const deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOneAndUpdate(
      {
        _id: req.params.id,
        owner: req.user!._id,
        isDeleted: false,
      },
      { isDeleted: true },
      { new: true }
    );

    if (!doc) {
      res.status(404).json({ message: 'Document not found or not owner' });
      return;
    }

    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete document' });
  }
};

export const shareDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validation = shareDocSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ message: 'Invalid data', errors: validation.error.flatten().fieldErrors });
      return;
    }

    const { email, permission } = validation.data;

    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      isDeleted: false,
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found or not owner' });
      return;
    }

    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      res.status(404).json({ message: 'User not found with that email' });
      return;
    }

    if (userToShare._id.toString() === req.user!._id.toString()) {
      res.status(400).json({ message: 'Cannot share with yourself' });
      return;
    }

    const existingCollab = doc.collaborators.find(
      (c) => c.user.toString() === userToShare._id.toString()
    );

    if (existingCollab) {
      existingCollab.permission = permission;
    } else {
      doc.collaborators.push({
        user: userToShare._id,
        permission,
        addedAt: new Date(),
      });
    }

    await doc.save();
    const populated = await doc.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'collaborators.user', select: 'name email avatar' },
    ]);

    res.json({ document: populated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to share document' });
  }
};

export const removeCollaborator = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      owner: req.user!._id,
      isDeleted: false,
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found or not owner' });
      return;
    }

    doc.collaborators = doc.collaborators.filter(
      (c) => c.user.toString() !== req.params.userId
    );

    await doc.save();

    res.json({ message: 'Collaborator removed' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove collaborator' });
  }
};

/**
 * Link-based join: any authenticated user who knows the document ID
 * can join as a collaborator (editor by default).
 */
export const joinDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    // Already the owner
    if (doc.owner.toString() === userId.toString()) {
      const populated = await doc.populate([
        { path: 'owner', select: 'name email avatar' },
        { path: 'collaborators.user', select: 'name email avatar' },
      ]);
      res.json({ document: populated });
      return;
    }

    // Already a collaborator
    const existing = doc.collaborators.find(
      (c) => c.user.toString() === userId.toString()
    );
    if (existing) {
      const populated = await doc.populate([
        { path: 'owner', select: 'name email avatar' },
        { path: 'collaborators.user', select: 'name email avatar' },
      ]);
      res.json({ document: populated });
      return;
    }

    // Add as collaborator
    doc.collaborators.push({
      user: userId,
      permission: 'editor',
      addedAt: new Date(),
    });
    await doc.save();

    const populated = await doc.populate([
      { path: 'owner', select: 'name email avatar' },
      { path: 'collaborators.user', select: 'name email avatar' },
    ]);

    res.json({ document: populated });
  } catch (error) {
    console.error('Join document error:', error);
    res.status(500).json({ message: 'Failed to join document' });
  }
};

export const toggleStar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [{ owner: userId }, { 'collaborators.user': userId }],
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    const isStarred = doc.isStarredBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (isStarred) {
      doc.isStarredBy = doc.isStarredBy.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else {
      doc.isStarredBy.push(userId);
    }

    await doc.save();

    res.json({ isStarred: !isStarred });
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle star' });
  }
};

export const getVersions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id },
      ],
    })
      .select('versions')
      .populate('versions.editor', 'name email avatar');

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    res.json({ versions: doc.versions.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch versions' });
  }
};

export const saveVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { content, summary } = req.body;

    const doc = await DocumentModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
        $or: [
          { owner: req.user!._id },
          {
            'collaborators.user': req.user!._id,
            'collaborators.permission': 'editor',
          },
        ],
      },
      {
        $push: {
          versions: {
            content: content || '',
            editor: req.user!._id,
            summary: summary || 'Manual save',
          },
        },
        content: content || '',
        lastEditedBy: req.user!._id,
      },
      { new: true }
    );

    if (!doc) {
      res.status(404).json({ message: 'Document not found or access denied' });
      return;
    }

    res.json({ message: 'Version saved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save version' });
  }
};

export const restoreVersion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        {
          'collaborators.user': req.user!._id,
          'collaborators.permission': 'editor',
        },
      ],
    });

    if (!doc) {
      res.status(404).json({ message: 'Document not found or access denied' });
      return;
    }

    const version = doc.versions.find(
      (v) => v._id.toString() === req.params.versionId
    );

    if (!version) {
      res.status(404).json({ message: 'Version not found' });
      return;
    }

    doc.content = version.content;
    doc.lastEditedBy = req.user!._id;
    doc.versions.push({
      content: version.content,
      editor: req.user!._id,
      summary: `Restored version from ${version.createdAt.toISOString()}`,
      createdAt: new Date(),
    } as any);

    await doc.save();

    res.json({ message: 'Version restored', document: doc });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore version' });
  }
};

export const getYjsState = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doc = await DocumentModel.findOne({
      _id: req.params.id,
      isDeleted: false,
      $or: [
        { owner: req.user!._id },
        { 'collaborators.user': req.user!._id },
      ],
    }).select('yjsState');

    if (!doc) {
      res.status(404).json({ message: 'Document not found' });
      return;
    }

    if (doc.yjsState) {
      res.json({ yjsState: doc.yjsState.toString('base64') });
    } else {
      res.json({ yjsState: null });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to get Yjs state' });
  }
};

export const saveYjsState = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { yjsState } = req.body;

    await DocumentModel.findOneAndUpdate(
      {
        _id: req.params.id,
        isDeleted: false,
        $or: [
          { owner: req.user!._id },
          {
            'collaborators.user': req.user!._id,
            'collaborators.permission': 'editor',
          },
        ],
      },
      { yjsState: Buffer.from(yjsState, 'base64') }
    );

    res.json({ message: 'Yjs state saved' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save Yjs state' });
  }
};
