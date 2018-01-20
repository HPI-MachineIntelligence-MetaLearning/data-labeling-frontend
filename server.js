// server.js
'use strict'

const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');

const app = express()
app.use(bodyParser.json());

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'POST');
    next();
});

app.post('/json', (req, res) => {
    console.log('Received request');
    console.log(req, 'request');
    fs.writeFile('images/' + req.body[0] + '.json', JSON.stringify(req.body[1]), (err) => {
        if (err) throw err;
        console.log('File written to ' + req.body[0]  + '.json');
        res.send('File written to ' + req.body[0]  + '.json')
    })
});

app.listen(3000, () => {
    console.log('Listening on port 3000. Post a file to http://localhost:3000 to save to /JSON.json');
});