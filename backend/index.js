require("dotenv").config();

const mongoose = require ("mongoose");

mongoose.connect('mongodb+srv://testuser:testuser123@notesapp.xktcq.mongodb.net/?retryWrites=true&w=majority&appName=notesapp');

const User = require("./models/user.model");
const Note = require("./models/note.model");
const express = require ("express");
const cors = require ("cors");
const app = express();
 
const jwt = require ("jsonwebtoken");
const { authenicateToken } = require("./utilities");
const noteModel = require("./models/note.model");
app.use(express.json());

app.use(
    cors ({
        origin: "*",
    })
);

app.get("/", (req,res) => {
    res.json({data: "hello"});
});


//Create account
app.post("/create-account", async(req,res) => {

    const {fullName, email, password} = req.body;

    if (!fullName) {
        return res 
        .status(400)
        .json({error:true, meessage:"Full Name is required"});
    }

    if (!email) {
        return res.status(400).json({error:true, message:"Email is required"});
    }

    if(!password) {
        return res 
        .status(400)
        .json({error:true, message:"Password is required"});
    }

    const isUser = await User.findOne ({email: email});

    if (isUser) {
        return res.json({
            error: true,
            message: "User already exist",
        });
    }

    const user = new User ({
        fullName,
        email,
        password,
    });

    await user.save();

    const accessToken = jwt.sign({user}, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "3600m",
    });

    return res.json ({
        error:false,
        user,
        accessToken,
        message: "Registration Successful",
    })
});

app.post("/login", async(req,res) => {
    const { email, password } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    if (!password) {
        return res.status(400).json({ message: "Password is required" });

    }

    const userInfo = await User.findOne({ email: email });

    if (!userInfo) {
        return res.status(400).json({ message: "User not found"})
    }

    if(userInfo.email == email && userInfo.password == password) {
        const user = { user: userInfo};
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "3600m",
        });

        return res.json({
            error: false,
            message: "Login Successful",
            email,
            accessToken,
        });
    } else {
        return res.status(400).json({
            error: true,
            message: "Invalid Credentitals",
        });
    }
});

// Get user 
app.get("/get-user", authenicateToken, async(req,res) => {
    const { user } = req.user;

    const isUser = await User.findOne({_id: user._id});

    if(!isUser) {
        return res.sendStatus(401);
    }

    return res.json({
        user: {
            fullName: isUser.fullName,
            email: isUser.email,
            _id: isUser._id,
            createdOn: isUser.createdOn,
        },
        message:""
    });
});

// Add Note
app.post("/add-note", authenicateToken, async(req,res) => {
    const {title, content, tags} = req.body;
    const { user } = req.user;

    if(!title) {
        return res.status(400).json({error: true, message: "Title is required"});
    }

    if(!content) {
        return res
        .status(400)
        .json({error: true, message: "Content is required"});
    }
    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note added succeessfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Sever Error",
        });
    }
});

//Edit Note
app.put("/edit-note/:noteId",authenicateToken, async(req,res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if(!title && !content && !tags) {
        return res
        .status(400)
        .json({error: true, message :"No change provided"});
    }

    try {
        const note = await Note.findOne({_id: noteId, userId: user._id});

        if (!note){
            return res.status(400).json({error: true, message: "Note not found"});
        }
        if (title) note.title = title;
        if(content) note.content = content;
        if (tags) note.tags = tags;
        if(isPinned) note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated succeessfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
})

//Get All Notes
app.get("/get-all-notes/", authenicateToken, async(req, res) => {
    const { user } = req.user;
    console.log("User from token:", user);
    console.log("Looking for notes with userId:", user._id);

    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });
        console.log("Found notes:", notes);
        return res.json({
            error: false,
            notes,
            message: "All notes retrieved successfully",
        });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
});

//Delete Note
app.delete("/delete-note/:noteId",authenicateToken, async(req,res) => {
    const noteId = req.params.noteId;
    const { user } = req.user;

    try {
        const note = await Note.findOne({_id: noteId, userId: user._id});

        if(!note) {
            return res.status(400).json({error: true, message:"Note not found"});
        }

        await Note.deleteOne({_id: noteId, userId: user._id});

        return res.json({
            error: false,
            meessage: "Note deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message:"Internal Server Error",
        });
    }
});

//Update isPinned Value
app.put("/update-note-pinned/:noteId",authenicateToken, async(req,res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;

    try {
        const note = await Note.findOne({_id: noteId, userId: user._id});

        if (!note){
            return res.status(400).json({error: true, message: "Note not found"});
        }

        note.isPinned = isPinned;
        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note updated succeessfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal Server Error",
        });
    }
})


app.listen(8000);

module.exports = app;
 