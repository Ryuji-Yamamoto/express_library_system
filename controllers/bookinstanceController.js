var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');
var moment = require('moment');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {

  BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
    
};

    // Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
    })

};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {       
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      // Successful, so render.
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        var bookinstance = new BookInstance(
          { book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
                .exec(function (err, books) {
                    if (err) { return next(err); }
                    // Successful, so render.
                    res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save(function (err) {
                if (err) { return next(err); }
                   // Successful - redirect to new record.
                   res.redirect(bookinstance.url);
                });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
  BookInstance.findById(req.params.id).
    exec(function(err,bookinstance){
      //console.log(bookinstance)
      if (err) { return next(err); }
      res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance: bookinstance});
  })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
  BookInstance.findByIdAndRemove(req.params.id, function(err){
    if (err) { return next(err); }
    // Success - go to author list
    res.redirect('/catalog/BookInstances');
  })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {

    async.parallel({
      bookinstance: function(callback){
        BookInstance.findById(req.params.id).exec(callback)
      },
      book_list: function(callback){
          Book.find().exec(callback)
      }
    },
    function(err,results, next){

        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            res.redirect('/catalog/BookInstances')}
      res.render('bookinstance_form', {title:'Book Instance Update', 
        bookinstance: results.bookinstance,
        due_back: moment(results.bookinstance.due_back).format('YYYY-MM-DD'),
        book_list: results.book_list});
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
        // Validate fields.
    //body('book', 'Book must not be empty.').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must not be empty.').isLength({ min: 1 }).trim(),
    body('due_back', 'Due due date of birth').optional({ checkFalsy: true }).isISO8601(),
    //body('status', 'Invalid Status').isLength({ min: 1 }).trim(),

    // Sanitize fields.
    //sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('due_back').toDate(),
    //sanitizeBody('status').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('bookinstance_form', { title: 'Update Book Instance', bookinstance: req.body, errors: errors });
            return;
        }
        else {
            // Data from form is valid.
            // Create an Author object with escaped and trimmed data.
            var bookinstance = new BookInstance(
                {
                    book: req.body.book,
                    imprint: req.body.imprint,
                    due_back: req.body.due_back,
                    status: req.body.status,
                    _id:req.params.id
                });
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
                if (err) { return next(err); }
                   // Successful - redirect to book detail page.
                   res.redirect(thebookinstance.url);
                });
        }
    }
];