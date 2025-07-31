const express = require('express');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get comments for a post
router.get('/post/:postId', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const comments = await Comment.find({ 
            post: req.params.postId,
            parentComment: null // Only top-level comments
        })
            .populate('author', 'username avatar')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Comment.countDocuments({ 
            post: req.params.postId,
            parentComment: null
        });

        res.json({
            comments,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment
router.post('/', auth, [
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters'),
    body('postId')
        .isMongoId()
        .withMessage('Invalid post ID'),
    body('parentCommentId')
        .optional()
        .isMongoId()
        .withMessage('Invalid parent comment ID')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { content, postId, parentCommentId } = req.body;

        // Check if post exists
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if parent comment exists (if provided)
        if (parentCommentId) {
            const parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ message: 'Parent comment not found' });
            }
        }

        const comment = new Comment({
            content,
            author: req.user._id,
            post: postId,
            parentComment: parentCommentId || null
        });

        await comment.save();
        await comment.populate('author', 'username avatar');

        res.status(201).json({
            message: 'Comment added successfully',
            comment
        });
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update comment
router.put('/:id', auth, [
    body('content')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the author
        if (comment.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this comment' });
        }

        comment.content = req.body.content;
        comment.isEdited = true;
        await comment.save();
        await comment.populate('author', 'username avatar');

        res.json({
            message: 'Comment updated successfully',
            comment
        });
    } catch (error) {
        console.error('Update comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete comment
router.delete('/:id', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user is the author or admin
        if (comment.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this comment' });
        }

        // Delete all replies to this comment
        await Comment.deleteMany({ parentComment: comment._id });

        await comment.remove();

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error('Delete comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/unlike comment
router.post('/:id/like', auth, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        await comment.toggleLike(req.user._id);
        await comment.populate('author', 'username avatar');

        res.json({
            message: 'Comment like toggled successfully',
            comment
        });
    } catch (error) {
        console.error('Toggle comment like error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get replies to a comment
router.get('/:id/replies', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const replies = await Comment.find({ parentComment: req.params.id })
            .populate('author', 'username avatar')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const total = await Comment.countDocuments({ parentComment: req.params.id });

        res.json({
            replies,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get replies error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 