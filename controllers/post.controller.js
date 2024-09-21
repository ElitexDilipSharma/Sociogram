import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";


export const addNewPost = async (req, res) => {
    try {
        const { caption } = req.body;
        const image = req.file;
        const authorId = req.id;

        if (!image) {
            return res.status(400).json({
                message: 'Image require',
            });
            // image upload
            const optimisedImageBuffer = await sharp(image.buffer)
                .resize({ width: 800, height: 800, fit: 'inside' })
                .toFormat('jpeg', { quality: 80 })
                .toBuffer();
            //buffer
            const fileUri = `data:image/jpeg;base64,${optimisedImageBuffer.toString('base64')}`;

            const cloudResponse = await cloudinary.uploader.upload(fileUri);
            const post = await Post.create({
                caption,
                image: cloudResponse.secure_url,
                author: authorId,
                created_at: new Date().getTime()
            });
            const user = await User.findById(authorId);
            if (user) {
                user.posts.push(post._id);
                await user.save();
            }

            await post.populate({ path: 'author', select: '-password' });

            return res.status(201).json({
                message: 'New post added',
                post,
                success: true
            })
        }
    } catch (error) {
        console.log(error);
    }
}
export const getAllPost = async (req, res) => {
    try {
        const post = await Post.findOne()
            .sort({ createdAt: -1 })
            .populate({ path: 'author', select: 'usernmae, profilePicture' })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: { path: 'author', select: 'username, profilePicture' }
            });
        return res.status(200).json({
            post,
            success: true,
        })
    } catch (error) {
        console.log(error);
    }
};
export const getUserPost = async (req, res) => {
    try {
        const authorId = req.id;
        const posts = await Post.find({ author: authorId })
            .sort({ createdAt: -1 })
            .populate({
                path: 'author',
                select: 'username, profilePicture',
            })
            .populate({
                path: 'comments',
                sort: { createdAt: -1 },
                populate: {
                    path: 'author',
                    select: 'username, profilePicture',
                }
            });
        return res.status(200).json({
            post,
            success: true,
        })
    } catch (error) {
        console.log(error);
    }
};
export const likePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'post not found', success: false });

        //like logic started
        await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } });
        await post.save();

        //implement socket io for real time notification


        return res.status(200).json({ message: 'post liked', success: true });
    } catch (error) {

    }
};
export const dislikePost = async (req, res) => {
    try {
        const likeKrneWalaUserKiId = req.id;
        const postId = req.params.id;
        const post = await Post.findById(postId);
        if (!post)
            return res.status(404).json({ message: 'post not found', success: false });

        //like logic started
        await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } });
        await post.save()

        //implement socket io for real time notification


        return res.status(200).json({ message: 'post disliked', success: true });
    } catch (error) {

    }
}
export const addComment = async (req, res) => {
    try {
        const postId = re.params.id;
        const commentKrneWalaUserKiId = req.id;
        const { text } = req.body;
        const post = await Post.findById(postId);
        if (!text) return res.status(400).json({
            message: 'text is required',
            success: false
        });

        //comment logic started
        const comment = await Comment.create({
            text,
            author: commentKrneWalaUserKiId,
            post: postId
        }).populate({
            path: 'author',
            select: "username, profilePicture"
        });
        post.comments.push(comment._id);
        await post.save();

        return res.status(201).json({
            message: 'comment added successfully',
            comment,
            success: true
        })

    } catch (error) {
        console.log(error);
    }
};
export const getCommentOfPost = async (req, res) => {
    try {
        const postId = req.params.id;

        const comments = await Comment.find({ post: postId }).populate('author', 'username', 'profilePicture');

        if (!comments) return res.status(404).json({ mesage: 'no comments found', success: false });
        return res.status(200).json({ success: true, comments });
    } catch (error) {
        console.log(error);

    }
}
export const deletePost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'no post found', success: false });

        //check if the logged user is the owner of the post
        if (post.author.toString() !== authorId) return res.status(404).json({ message: 'unauthorised' });

        //delete post
        await Post.findByIdAndDelete(postId);

        //remove the post id from the user's post
        let user = await User.findById(authorId);
        user.posts = user.posts.filter(id => id.toString() !== postId);
        await user.save();

        //delete associated comments
        await Comment.deleteMany({ post: postId });

        return res.status(200).json({
            message: 'post deleted succesfully',
            success: true
        })

    } catch (error) {
        console.log(error);

    }
}
export const bookmarkPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const authorId = req.id;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'post not found', success: false });

        const user = await User.findById(authorId);
        if (user.bookmarks.includes(post._id)) {
            //already bookmark  -> remove from the bookmark
            await User.updateOne({ $pull: { bookmarks: post._id } });
            await User.save();
            return res.status(200).json({ type: 'unsaved', message: 'post removed from the bookmark', success: true });

        } else {
            //bookmark krna padega
            await User.updateOne({ $addToSet: { bookmarks: post._id } });
            await User.save();
            return res.status(200).json({ type: 'saved', message: 'post bookmarked', success: true });

        }


    } catch (error) {
        console.log(error);

    }
}
