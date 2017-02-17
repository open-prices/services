var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var public_path = path.join(__dirname, '../../src/webapi', 'public')
app.use(express.static(public_path));



var seneca = require('./seneca-client')

app.use('/api', require('./routes/api'))
app.use(require('./routes/services'))

app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.json(err);
});

app.listen(3000)

module.exports = app;