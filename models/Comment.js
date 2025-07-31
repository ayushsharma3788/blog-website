const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        maxlength: 1000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isEdited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Virtual for like count
commentSchema.virtual('likeCount').get(function() {
    return this.likes.length;
});

// Method to check if user liked the comment
commentSchema.methods.isLikedBy = function(userId) {
    return this.likes.includes(userId);
};

// Method to toggle like
commentSchema.methods.toggleLike = function(userId) {
    const index = this.likes.indexOf(userId);
    if (index > -1) {
        this.likes.splice(index, 1);
    } else {
        this.likes.push(userId);
    }
    return this.save();
};

// Ensure virtuals are serialized
commentSchema.set('toJSON', { virtuals: true });
commentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Comment', commentSchema); 