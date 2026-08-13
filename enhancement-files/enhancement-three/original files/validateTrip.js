// Validates the required fields for creating or updating a trip before the
// request ever reaches the database.

const REQUIRED_FIELDS = [
    'code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'
];

function validateTrip(req, res, next) {
    const missingFields = REQUIRED_FIELDS.filter((field) => {
        const value = req.body[field];
        return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
        const error = new Error(
            `Trip request is missing required field(s): ${missingFields.join(', ')}`
        );
        error.status = 400;
        return next(error);
    }

    if (isNaN(Number(req.body.perPerson))) {
        const error = new Error('perPerson must be a valid number');
        error.status = 400;
        return next(error);
    }

    next();
}

module.exports = validateTrip;
