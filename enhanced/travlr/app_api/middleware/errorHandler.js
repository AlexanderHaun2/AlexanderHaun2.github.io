// Centralized error handler for the /api routes.
//
// Any error passed to next(err) anywhere in the API ends up here and gets one consistent
// JSON response instead of every controller method formatting its own
// error response

function apiErrorHandler(err, req, res, next) {
    console.error(err);

    // MongoDB duplicate key errors (e.g. registering with an email that
    // already exists). The raw MongoDB message exposes internal details
    // like collection and index names, so a clean message is sent instead.
    if (err.code === 11000) {
        return res.status(409).json({
            message: 'A record with that value already exists.'
        });
    }

    // Mongoose validation errors (for example, a required field that
    // failed schema validation during .save())
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation failed',
            details: Object.values(err.errors).map((e) => e.message)
        });
    }

    const status = err.status || 500;
    res.status(status).json({
        message: err.message || 'An unexpected error occurred'
    });
}

module.exports = apiErrorHandler;
