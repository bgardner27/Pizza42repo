const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
require('dotenv').config();

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw 'Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file'
}

app.use(cors());

const checkJwt = jwt({
  // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

const checkScopes = jwtAuthz([ 'read:messages' ]);

app.get('/api/public', function(req, res) {
  res.json({ message: "Hello from Pizza 42! You don't need to be logged in to see this." });
});

app.get('/api/private', checkJwt, checkScopes, function(req, res) {
  res.json({ message: "Thanks for using the Pizza 42 app! Please feel free to make an order" });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  if (err.name === 'UnauthorizedError')
    return res.status(401).json({ message: err.message });

  res.status(500).json({ message: err.message });
});

app.listen(3001);
console.log('Listening on http://localhost:3001');
