// Validates trip data before it reaches the database.
//
// Two variants are exported. validateTrip requires every field to be present. 
// validateTrip.validateTripUpdate does not require every field, since
// findOneAndUpdate strips any field the caller omits and leaves the
// existing value untouched. Whatever fields ARE present,
// in either case, are still checked for validity.
const REQUIRED_FIELDS = [
    'code', 'name', 'length', 'start', 'resort', 'perPerson', 'image', 'description'
];

function isBlank(value) {
    return value === undefined || value === null || value === '';
}

function createTripValidator({ partial }) {
    return function (req, res, next) {
        if (partial) {
            const presentFields = REQUIRED_FIELDS.filter((field) => req.body[field] !== undefined);
            if (presentFields.length === 0) {
                const error = new Error('Trip update request must include at least one field to update');
                error.status = 400;
                return next(error);
            }
        } else {
            const missingFields = REQUIRED_FIELDS.filter((field) => isBlank(req.body[field]));
            if (missingFields.length > 0) {
                const error = new Error(
                    `Trip request is missing required field(s): ${missingFields.join(', ')}`
                );
                error.status = 400;
                return next(error);
            }
        }

        // perPerson is checked whenever it's present
        if (req.body.perPerson !== undefined && isNaN(Number(req.body.perPerson))) {
            const error = new Error('perPerson must be a valid number');
            error.status = 400;
            return next(error);
        }

        next();
    };
}

const validateTrip = createTripValidator({ partial: false });
const validateTripUpdate = createTripValidator({ partial: true });

module.exports = validateTrip;
module.exports.validateTripUpdate = validateTripUpdate;
