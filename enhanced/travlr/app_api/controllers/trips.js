const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const Model = mongoose.model('trips');
const asyncHandler = require('../middleware/asyncHandler');

// GET: /trips - lists all the trips
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsList = asyncHandler(async (req, res) => {
    const trips = await Model
        .find({}) // No filter, return all records
        .exec();

    return res
        .status(200)
        .json(trips);
});

// GET: /trips/:tripCode - finds a single trip by its code
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsFindByCode = asyncHandler(async (req, res) => {
    // findOne, not find: this is looking up a single trip by its unique
    // code, so it should return one, not an array.
    const trip = await Model
        .findOne({ 'code': req.params.tripCode })
        .exec();

    if (!trip) { // No trip matched this code
        return res
            .status(404)
            .json({ message: `No trip found with code ${req.params.tripCode}` });
    }

    return res
        .status(200)
        .json(trip);
});

// POST: /trips - Adds a new Trip
// Regardless of outcome, response must include HTML status code
// and JSON message to the requesting client
const tripsAddTrip = asyncHandler(async (req, res) => {
    const newTrip = new Trip({
        code: req.body.code,
        name: req.body.name,
        length: req.body.length,
        start: req.body.start,
        resort: req.body.resort,
        perPerson: req.body.perPerson,
        image: req.body.image,
        description: req.body.description
    });

    // If schema validation fails here, .save() rejects and asyncHandler
    // forwards that rejection to the centralized error handler
    const savedTrip = await newTrip.save();

    return res
        .status(201)
        .json(savedTrip);
});

// PUT: /trips/:tripCode - Updates an existing trip
// Regardless of outcome, response must include HTML status
// code and JSON message to the requesting client
const tripsUpdateTrip = asyncHandler(async (req, res) => {
    const updatedTrip = await Model
        .findOneAndUpdate(
            { 'code': req.params.tripCode },
            {
                code: req.body.code,
                name: req.body.name,
                length: req.body.length,
                start: req.body.start,
                resort: req.body.resort,
                perPerson: req.body.perPerson,
                image: req.body.image,
                description: req.body.description
            },
            {
                new: true,          // return the updated document, not the old one
                runValidators: true // findOneAndUpdate skips schema validation
                                     // unless this is explicitly set to true
            }
        )
        .exec();

    if (!updatedTrip) { // No trip matched this code
        return res
            .status(404)
            .json({ message: `No trip found with code ${req.params.tripCode}` });
    }

    return res
        .status(200)
        .json(updatedTrip);
});

module.exports = {
    tripsList,
    tripsFindByCode,
    tripsAddTrip,
    tripsUpdateTrip
};
