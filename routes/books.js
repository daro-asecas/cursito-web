const express = require("express")
const router = express.Router()
const Author = require("../models/author")
const Book = require("../models/book")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const uploadPath = path.join("public", Book.coverImageBasePath)
const imageMimeTypes = ["image/jpeg", "image/png", "image/gif"]
const upload = multer({
    dest: uploadPath
    // fileFilter: (req, file, callback) => {
    //     callback(null, imageMimeTypes.includes(file.mimetype))
    // }
})

// All Books Route
router.get("/", async (req, res) => {
    let query = Book.find()
    if (req.query.title != null && req.query.title != "") {
        query = query.regex("title", new RegExp(req.query.title, "i"))
    }
    if (req.query.publishedAfter != null && req.query.publishedAfter != "") {
        query = query.gte("publishDate", req.query.publishedAfter)
    }
    if (req.query.publishedBefore != null && req.query.publishedBefore != "") {
        query = query.lte("publishDate", req.query.publishedBefore)
    }
    try {
        const  books = await query.exec()
        res.render("books/index", {
            books: books,
            searchOptions: req.query
        })
    } catch {
        res.redirect("/")
    }

})

// New Book Route
router.get("/new", async (req, res) => {
    renderNewPage(res, new Book())
})

// Create Book Route
router.post("/", upload.single("cover"), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null    // req.body.cover
    console.log(req.file)                                          // typeof(fileName))
    const book = new Book({
        title: req.body.title,
        author: req.body.author,
        publishDate: new Date(req.body.publishDate),
        pageCount: req.body.pageCount,
        coverImageName: fileName,
        description: req.body.description
    })
    //                   eliminar todo esto cuando empieze a funcionar la carga de libros
    // console.log("luego de meterlo VV")
    // console.log(book.author)
    // console.log("luego de meterlo AA")
    try {
        const newBook = await book.save()
        // res.redirect(´books/${newBook.id}´)
        res.redirect("books")
    } catch {
        if (book.coverImageName != null) {
            removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true)
    }
})

function removeBookCover(filename) {
    fs.unlink(path.join(uploadPath, fileName), err => {
        if (err) console.err(err)
    })
}

async function renderNewPage(res, book, hasError = false) {
    try {
        const authors = await Author.find({})
        const params = {
            authors: authors,
            book: book
        }
        if (hasError) params.errorMessage ="Error creating Book"
        res.render("books/new", params)
    } catch {
        res.redirect("/books")
    }
}


module.exports = router