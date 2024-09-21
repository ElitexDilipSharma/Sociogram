import mongoose from "mongoose";
const postSchema = new mongoose.Schema({
    caption: { type: String, deafualt: ' ' },
    image: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bookmark' }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Share' }],
    notification: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

});

export const Post = mongoose.model('Post', postSchema);