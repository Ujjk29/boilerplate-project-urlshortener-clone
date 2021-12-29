require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require("body-parser");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

const mongoose = require('mongoose');
const {Schema} = require("mongoose/lib/browser");
mongoose.connect(process.env.MONGO_URI).catch(err => {console.log(err)});

let urlSchema = new Schema({
  original_url: String,
  short_url: String
});

const URL = mongoose.model("URL", urlSchema);

function validURL(str) {
  const pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
  return !!pattern.test(str);
}

let entries = 0;

app.post(
    "/api/shorturl",
    async function (req, res) {
        let url = req.body.url;
        if (!validURL(url)) {
            res.json({error: 'invalid url'});
        } else {
            entries++;
            let doc = {original_url: url, short_url: entries};
            let newURL = new URL(doc);
            await newURL.save(function (err,data) {
                if (err) console.log(err);
            });
            res.json(doc);
        }
    }
);

app.get(
    "/api/shorturl/:short_url?",
    async function (req, res) {
      let shorturl = req.params.short_url;
      let urlObject = await URL.findOne({short_url: shorturl});
      console.log(urlObject);
      res.redirect(urlObject.original_url);
    }
);