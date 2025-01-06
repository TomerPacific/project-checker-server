const express = require('express')
const app = express()
var port = process.env.PORT || 3000

require('dotenv').config()

const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const constants = require('./projectCheckerConstants.ts');
const nodeFetch = require('node-fetch');
const { response } = require('express');

let statuses = [];

app.use(cors());
app.use(bodyParser.json());

app.get('/checkStatus', function(req, res) {
  statuses = [];
  Promise.all(constants.projectEndpoints.map((endpoint) => 
  {
    return new Promise(function(resolve, reject) {
      nodeFetch(endpoint)
      .then((result) => {
        if (result.url && result.status) {
          statuses.push({
            name: result.url,
            status: result.status
          });
          resolve("Success");
      } else {
        statuses.push({
          name: 'Error',
          status: 'No information was received from the server',
        });
        resolve("Success");
      }
      reject();
      })
    })
  })
).then(function() {
  res.status(200).send(
    { websites: statuses}
    )
  })
  .catch((error) => console.error(error));
});

  app.get('/websiteStatus', function (req, res) {
    let url = req.query.url;
    if (!url) {
      res.status(500).send(
        { website: url,
          error: 'Missing url'
        })
        return
    }
    fetch(url)
    .then(function(response) {
        res.status(200).send(
          { website: url,
            websiteStatus: response.status
          })
          if (response.status !== 200) {
              sendMail(url, response.status);
          }
    })
    .catch(function(error) {
      res.status(500).send(
        { website: url,
          error: error
        })
    })
  })

  function sendMail(website, status) {
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
        clientId: process.env.OAUTH_CLIENTID,
        clientSecret: process.env.OAUTH_CLIENT_SECRET,
        refreshToken: process.env.OAUTH_REFRESH_TOKEN
      }
    });

    let mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: process.env.MAIL_USERNAME,
      subject: 'ProjectChecker - Website Is Down',
      text: 'The website ' + website + ' returned with a status of ' + status
    };

    transporter.sendMail(mailOptions, function(err, data) {
      if (err) {
        console.log("Error " + err);
      } else {
        
      }
    });

  }

  app.listen(port, 
    () => console.log(`ProjectChecker is listening at http://localhost:${port}`))