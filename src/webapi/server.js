var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));



var seneca = require('./seneca-client')


app.get('/services', (req, res, next) => {
    seneca.act({
        role: 'mesh',
        get: 'members'
    }, (err, response) => {
        if (err) return next(err)
        var { list } = response
        res.json({
            pins: list.map(service => service.pin),
            list,
        })
    })
})
app.get('/services/:service', (req, res, next) => {

    var { service } = req.params
    service = service.toUpperCase()

    seneca.act({
        service: service + '/' + service
    }, (err, response) => {
        if (err) return next(err)
        res.json(response)
    })

})

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