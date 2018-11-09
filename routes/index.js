var express = require('express');
var router = express.Router();
var connexion = require('../lib/connexion_mysql');
var Busboy = require("busboy");
var moment = require("moment");
var parseString = require("xml2js").parseString;
var jsonxml = require('jsontoxml');
router.get('/', function(req, res, next) {
    connexion.query('SELECT * FROM miage.data', [], function(error, results, fields) {
        if (error) {
            console.log(error);
            return next(error);
        }
        return res.render('index', {
            data: results,
            moment: moment
        });
    });
});
router.get('/view', function(req, res, next) {
    if (req.query.id) {
        connexion.query('SELECT * FROM miage.data WHERE id=?', [parseInt(req.query.id)], function(error, results, fields) {
            if (error) {
                console.log(error);
                return next(error);
            }
            if (results[0]) {
                return res.render('view', {
                    data: JSON.parse(results[0].data),
                    moment: moment
                });
            }
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});
router.get('/export', function(req, res, next) {
    if (req.query.id) {
        connexion.query('SELECT * FROM miage.data WHERE id=?', [parseInt(req.query.id)], function(error, results, fields) {
            if (error) {
                console.log(error);
                return next(error);
            }
            if (results[0]) {
                res.set('Content-Type', 'text/xml');
                res.set({"Content-Disposition":"attachment; filename=\""+results[0].name+".xml\""});
                return res.send("<?xml version=\"1.0\" encoding=\"UTF-8\"?>"+jsonxml(results[0].data));
            } else {
                res.redirect("/");
            }
        });
    } else {
        res.redirect("/");
    }
});
router.post('/view', function(req, res, next) {
    //process data here:
    var busy = new Busboy({
        headers: req.headers
    });
    busy.on('finish', function() {
        if (req.files && req.files.FileXML) {
            var dataXML = req.files.FileXML.data.toString('utf8'); //recupere les données du xml
            //dataXML = dataXML.replace(/\'/g, "\'");// J'ai rajoute cette ligne car probleme si ' dans le XML file
            dataXML = dataXML.replace(/\n/g, ' '); //Caractere inconnu si on eneleve pas les \n
            parseString(dataXML, {
                trim: true
            }, function(err, result) { //parse to JSON format
                return res.render('view', {
                    error: null,
                    data: result
                });
            });
        } else {
            return res.render('view', {
                error: "No file.",
                data: null
            });
        }
    });
    req.pipe(busy);
});
router.post('/save', function(req, res, next) {
    if (!req.body.id) {
        connexion.query('INSERT into miage.data (data,name) VALUES (?,?)', [JSON.stringify(req.body.data), req.body.name], function(error, results, fields) {
            if (error) {
                console.log(error);
                return res.status(500).send(error);
            }
            res.send("ok");
        });
    } else {
        connexion.query('UPDATE miage.data SET data=?,name=? WHERE id=?', [JSON.stringify(req.body.data), req.body.name, parseInt(req.body.id)], function(error, results, fields) {
            if (error) {
                console.log(error);
                return res.status(500).send(error);
            }
            res.send("ok");
        });
    }
});
router.get('/delete', function(req, res, next) {
    if (req.query.id) {
        connexion.query('DELETE FROM miage.data WHERE id=?', [parseInt(req.query.id)], function(error, results, fields) {
            if (error) {
                console.log(error);
                return next(error);
            }
            res.redirect("/");
        });
    } else {
        res.redirect("/");
    }
});
module.exports = router;