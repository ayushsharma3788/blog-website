const express = require('express');
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all posts (with optional authentication for likes)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10, tag, search, author } = req.query;
        const skip = (page - 1) * limit;

        let query = { status: 'published' };

        if (tag) {
            query.tags = { $in: [tag] };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        if (author) {
            query.author = author;
        }

        const posts = await Post.find(query)
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Add like status for authenticated users
        if (req.user) {
            posts.forEach(post => {
                post.isLiked = post.likes.includes(req.user._id);
            });
        }

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username avatar bio')
            .populate({
                path: 'comments',
                populate: {
                    path: 'author',
                    select: 'username avatar'
                }
            });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Add like status for authenticated users
        if (req.user) {
            post.isLiked = post.likes.includes(req.user._id);
        }

        res.json({ post });
    } catch (error) {
        console.error('Get post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new post
router.post('/', auth, [
    body('title')
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('content')
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters long'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('featuredImage')
        .optional()
        .isURL()
        .withMessage('Featured image must be a valid URL')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, content, tags, featuredImage, status = 'published' } = req.body;

        const post = new Post({
            title,
            content,
            tags: tags || [],
            featuredImage,
            status,
            author: req.user._id
        });

        await post.save();
        await post.populate('author', 'username avatar');

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        console.error('Create post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update post
router.put('/:id', auth, [
    body('title')
        .optional()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),
    body('content')
        .optional()
        .isLength({ min: 10 })
        .withMessage('Content must be at least 10 characters long'),
    body('tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),
    body('featuredImage')
        .optional()
        .isURL()
        .withMessage('Featured image must be a valid URL')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is the author or admin
        if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this post' });
        }

        const updates = req.body;
        Object.assign(post, updates);
        await post.save();
        await post.populate('author', 'username avatar');

        res.json({
            message: 'Post updated successfully',
            post
        });
    } catch (error) {
        console.error('Update post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Check if user is the author or admin
        if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Not authorized to delete this post' });
        }

        // Delete associated comments
        await Comment.deleteMany({ post: post._id });

        await post.remove();

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/unlike post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        await post.toggleLike(req.user._id);
        await post.populate('author', 'username avatar');

        res.json({
            message: 'Post like toggled successfully',
            post
        });
    } catch (error) {
        console.error('Toggle like error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const posts = await Post.find({ 
            author: req.params.userId,
            status: 'published'
        })
            .populate('author', 'username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Add like status for authenticated users
        if (req.user) {
            posts.forEach(post => {
                post.isLiked = post.likes.includes(req.user._id);
            });
        }

        const total = await Post.countDocuments({ 
            author: req.params.userId,
            status: 'published'
        });

        res.json({
            posts,
            pagination: {
                current: parseInt(page),
                pages: Math.ceil(total / limit),
                total
            }
        });
    } catch (error) {
        console.error('Get user posts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 