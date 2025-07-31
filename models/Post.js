const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true,
        minlength: 10
    },
    excerpt: {
        type: String,
        maxlength: 300
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    featuredImage: {
        type: String,
        default: 'https://via.placeholder.com/800x400'
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published'
    },
    readTime: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
    return this.comments ? this.comments.length : 0;
});

// Method to check if user liked the post
postSchema.methods.isLikedBy = function(userId) {
    return this.likes.includes(userId);
};

// Method to toggle like
postSchema.methods.toggleLike = function(userId) {
    const index = this.likes.indexOf(userId);
    if (index > -1) {
        this.likes.splice(index, 1);
    } else {
        this.likes.push(userId);
    }
    return this.save();
};

// Pre-save middleware to generate excerpt
postSchema.pre('save', function(next) {
    if (!this.excerpt && this.content) {
        this.excerpt = this.content.substring(0, 150) + '...';
    }
    
    // Calculate read time (rough estimate: 200 words per minute)
    if (this.content) {
        const wordCount = this.content.split(' ').length;
        this.readTime = Math.ceil(wordCount / 200);
    }
    
    next();
});

// Ensure virtuals are serialized
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema); 