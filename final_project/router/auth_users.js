const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
    // A username is valid (available) if no registered user already has it
    const userswithsamename = users.filter((user) => user.username === username);
    return userswithsamename.length === 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
    // Check that a user with this username and password exists in our records
    const validusers = users.filter((user) => user.username === username && user.password === password);
    return validusers.length > 0;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (authenticatedUser(username, password)) {
        // Create a JWT access token that is valid for 1 hour
        const accessToken = jwt.sign({ data: username }, 'access', { expiresIn: 60 * 60 });

        // Save the token and username in the session
        req.session.authorization = { accessToken, username };
        return res.status(200).json({ message: "User successfully logged in" });
    } else {
        return res.status(401).json({ message: "Invalid login. Check username and password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }
    if (!review) {
        return res.status(400).json({ message: "Review text is required as a query parameter, e.g. ?review=Great book" });
    }

    // Each user has one review per book: a new review is added, an existing one is modified
    const isUpdate = books[isbn].reviews.hasOwnProperty(username);
    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} has been ${isUpdate ? "updated" : "added"}.`,
        reviews: books[isbn].reviews
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization.username;

    if (!books[isbn]) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
    }

    // Users can only delete their own review
    if (books[isbn].reviews.hasOwnProperty(username)) {
        delete books[isbn].reviews[username];
        return res.status(200).json({
            message: `Review for the ISBN ${isbn} posted by the user ${username} deleted.`,
            reviews: books[isbn].reviews
        });
    } else {
        return res.status(404).json({ message: `No review by user ${username} found for ISBN ${isbn}` });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
