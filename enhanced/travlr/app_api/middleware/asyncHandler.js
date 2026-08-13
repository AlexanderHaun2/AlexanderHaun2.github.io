// Wraps an async route handler so any rejected promise or thrown error is
// automatically forwarded to Express's error-handling middleware via next(err).

function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = asyncHandler;
