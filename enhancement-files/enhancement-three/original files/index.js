const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken'); // Enable JSON Web Tokens

// This is where we import the controllers we will route
const tripsController = require("../controllers/trips");
const authController = require("../controllers/authentication");
const validateTrip = require("../middleware/validateTrip");

// Method to authenticate our JWT
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (authHeader == null) {
        return res.status(401).json({ message: 'Authorization header required' });
    }
    const token = authHeader.split(' ')[1];
    if (token == null) {
        return res.status(401).json({ message: 'Bearer token required' });
    }
    // console.log(process.env.JWT_SECRET);
    // console.log(jwt.decode(token));

    // jwt.verify() is asynchronous here because it takes a callback.
    // The request is only allowed to continue from within that
    // callback after verification has actually finished.
    jwt.verify(token, process.env.JWT_SECRET, (err, verified) => {
        if (err) {
            return res.status(401).json({ message: 'Token validation error' });
        }
        req.auth = verified;
        next();
    });
}


router.route("/register").post(authController.register);
router.route("/login").post(authController.login);

// define route for our trips endpoint
router
    .route("/trips")
    .get(tripsController.tripsList) // GET Method routes tripList
    .post(authenticateJWT, validateTrip, tripsController.tripsAddTrip); // POST Method Adds a Trip

// Get Method routes tripsFindByCode - requires parameter
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(authenticateJWT, tripsController.tripsUpdateTrip);

module.exports = router;