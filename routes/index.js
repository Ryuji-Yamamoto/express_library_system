var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.redirect('/catalog');
});

/* GET home page. */
router.get('/cool', function(req, res, next) {
  res.render('users', { title: 'cool' });
});

module.exports = router;