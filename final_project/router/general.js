const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ message: "Unable to register user. Username and password are required" });
    }
    if (!isValid(username)) {
        return res.status(409).json({ message: "User already exists!" });
    }

    users.push({ username: username, password: password });
    return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// ---------------------------------------------------------------------------
// Helper functions that return Promises, so the routes below can use
// async/await instead of reading the book data synchronously.
// ---------------------------------------------------------------------------

const getAllBooks = () => {
    return new Promise((resolve) => {
        resolve(books);
    });
};

const getBookByISBN = (isbn) => {
    return new Promise((resolve, reject) => {
        const book = books[isbn];
        if (book) {
            resolve(book);
        } else {
            reject(new Error(`Book with ISBN ${isbn} not found`));
        }
    });
};

const getBooksByAuthor = (author) => {
    return new Promise((resolve) => {
        const matches = Object.keys(books)
            .filter((isbn) => books[isbn].author.toLowerCase() === author.toLowerCase())
            .map((isbn) => ({ isbn: isbn, ...books[isbn] }));
        resolve(matches);
    });
};

const getBooksByTitle = (title) => {
    return new Promise((resolve) => {
        const matches = Object.keys(books)
            .filter((isbn) => books[isbn].title.toLowerCase() === title.toLowerCase())
            .map((isbn) => ({ isbn: isbn, ...books[isbn] }));
        resolve(matches);
    });
};

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
    const allBooks = await getAllBooks();
    return res.status(200).send(JSON.stringify(allBooks, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
    try {
        const book = await getBookByISBN(req.params.isbn);
        return res.status(200).send(JSON.stringify(book, null, 4));
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
});

// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
    const author = req.params.author;
    const booksByAuthor = await getBooksByAuthor(author);
    if (booksByAuthor.length > 0) {
        return res.status(200).send(JSON.stringify({ booksbyauthor: booksByAuthor }, null, 4));
    }
    return res.status(404).json({ message: `No books found by author ${author}` });
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
    const title = req.params.title;
    const booksByTitle = await getBooksByTitle(title);
    if (booksByTitle.length > 0) {
        return res.status(200).send(JSON.stringify({ booksbytitle: booksByTitle }, null, 4));
    }
    return res.status(404).json({ message: `No books found with title ${title}` });
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;
    if (books[isbn]) {
        return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
    }
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

// ---------------------------------------------------------------------------
// Tasks 10-13: retrieve books from the API above using Axios,
// with async/await and Promise callbacks.
// ---------------------------------------------------------------------------

const BASE_URL = "http://localhost:5000";

// Task 10: Get all books - using async/await with Axios
const getAllBooksWithAxios = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching all books: ${error.message}`);
    }
};

// Task 11: Get book details by ISBN - using Promise callbacks with Axios
const getBookByISBNWithAxios = (isbn) => {
    return axios.get(`${BASE_URL}/isbn/${isbn}`)
        .then((response) => response.data)
        .catch((error) => {
            throw new Error(`Error fetching book with ISBN ${isbn}: ${error.message}`);
        });
};

// Task 12: Get book details by author - using async/await with Axios
const getBooksByAuthorWithAxios = async (author) => {
    try {
        const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching books by author ${author}: ${error.message}`);
    }
};

// Task 13: Get book details by title - using async/await with Axios
const getBooksByTitleWithAxios = async (title) => {
    try {
        const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
        return response.data;
    } catch (error) {
        throw new Error(`Error fetching books with title ${title}: ${error.message}`);
    }
};

module.exports.general = public_users;
module.exports.getAllBooksWithAxios = getAllBooksWithAxios;
module.exports.getBookByISBNWithAxios = getBookByISBNWithAxios;
module.exports.getBooksByAuthorWithAxios = getBooksByAuthorWithAxios;
module.exports.getBooksByTitleWithAxios = getBooksByTitleWithAxios;
