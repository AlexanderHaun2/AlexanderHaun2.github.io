// Standalone verification for the Milestone Two enhancements.
// Tests the middleware logic directly with mocked req/res/next objects

const jwt = require('jsonwebtoken');
const assert = require('assert');

const SECRET = 'test-secret';
process.env.JWT_SECRET = SECRET;

let passed = 0;
let failed = 0;

function check(name, condition) {
    if (condition) {
        console.log(`PASS: ${name}`);
        passed++;
    } else {
        console.log(`FAIL: ${name}`);
        failed++;
    }
}

function mockRes() {
    const res = {};
    res.statusCode = null;
    res.body = null;
    res.status = function (code) { res.statusCode = code; return res; };
    res.json = function (data) { res.body = data; return res; };
    res.sendStatus = function (code) { res.statusCode = code; return res; };
    return res;
}

// ---------- Test 1: authenticateJWT rejects an invalid token and does NOT call next() ----------
(function testInvalidToken() {
    // Re-require fresh each time to avoid module caching issues across tests
    delete require.cache[require.resolve('./app_api/routes/index.js')];
    const routerModule = require('./app_api/routes/index.js');

    const tripsLayer = routerModule.stack.find(
        (l) => l.route && l.route.path === '/trips' && l.route.methods.post
    );
    const authenticateJWT = tripsLayer.route.stack.find((s) => s.name === 'authenticateJWT').handle;

    let nextCalled = false;
    const req = { headers: { authorization: 'Bearer garbage-invalid-token' } };
    const res = mockRes();
    const next = () => { nextCalled = true; };

    authenticateJWT(req, res, next);

    // jwt.verify's callback is async, so give it a tick to run
    setTimeout(() => {
        check('invalid token: next() is NOT called', nextCalled === false);
        check('invalid token: responds with 401', res.statusCode === 401);
        check('invalid token: response body has a message', !!res.body && !!res.body.message);
        runTest2();
    }, 50);
})();

// ---------- Test 2: authenticateJWT accepts a valid token and DOES call next() ----------
function runTest2() {
    delete require.cache[require.resolve('./app_api/routes/index.js')];
    const routerModule = require('./app_api/routes/index.js');
    const tripsLayer = routerModule.stack.find(
        (l) => l.route && l.route.path === '/trips' && l.route.methods.post
    );
    const authenticateJWT = tripsLayer.route.stack.find((s) => s.name === 'authenticateJWT').handle;

    const validToken = jwt.sign({ email: 'test@example.com' }, SECRET, { expiresIn: '1h' });

    let nextCalled = false;
    const req = { headers: { authorization: `Bearer ${validToken}` } };
    const res = mockRes();
    const next = () => { nextCalled = true; };

    authenticateJWT(req, res, next);

    setTimeout(() => {
        check('valid token: next() IS called', nextCalled === true);
        check('valid token: req.auth gets set', !!req.auth && req.auth.email === 'test@example.com');
        runTest3();
    }, 50);
}

// ---------- Test 3: validateTrip rejects missing fields ----------
function runTest3() {
    const validateTrip = require('./app_api/middleware/validateTrip');

    const req = { body: { code: 'BALI01', name: 'Bali Getaway' } }; // missing several required fields
    const res = mockRes();
    let forwardedError = null;
    const next = (err) => { forwardedError = err; };

    validateTrip(req, res, next);

    check('validateTrip: missing fields forwarded as an error', !!forwardedError);
    check('validateTrip: error has status 400', forwardedError && forwardedError.status === 400);
    check(
        'validateTrip: error message lists the missing fields',
        forwardedError && /length/.test(forwardedError.message) && /resort/.test(forwardedError.message)
    );

    runTest4();
}

// ---------- Test 4: validateTrip rejects a non-numeric perPerson ----------
function runTest4() {
    const validateTrip = require('./app_api/middleware/validateTrip');

    const req = {
        body: {
            code: 'BALI01', name: 'Bali Getaway', length: '7 days', start: '2026-01-01',
            resort: 'Bali Resort', perPerson: 'not-a-number', image: 'bali.png', description: 'desc'
        }
    };
    const res = mockRes();
    let forwardedError = null;
    const next = (err) => { forwardedError = err; };

    validateTrip(req, res, next);

    check('validateTrip: non-numeric perPerson forwarded as an error', !!forwardedError);
    check(
        'validateTrip: perPerson error message is correct',
        forwardedError && /perPerson must be a valid number/.test(forwardedError.message)
    );

    runTest5();
}

// ---------- Test 5: validateTrip allows a valid, complete trip through ----------
function runTest5() {
    const validateTrip = require('./app_api/middleware/validateTrip');

    const req = {
        body: {
            code: 'BALI01', name: 'Bali Getaway', length: '7 days', start: '2026-01-01',
            resort: 'Bali Resort', perPerson: '1500', image: 'bali.png', description: 'desc'
        }
    };
    const res = mockRes();
    let nextCalled = false;
    let forwardedError = null;
    const next = (err) => { if (err) forwardedError = err; else nextCalled = true; };

    validateTrip(req, res, next);

    check('validateTrip: valid trip calls next() with no error', nextCalled === true && !forwardedError);

    runTest6();
}

// ---------- Test 6: asyncHandler catches a rejected promise and forwards it to next(err) ----------
function runTest6() {
    const asyncHandler = require('./app_api/middleware/asyncHandler');

    const failingHandler = asyncHandler(async (req, res) => {
        throw new Error('Simulated database failure');
    });

    let forwardedError = null;
    const next = (err) => { forwardedError = err; };

    failingHandler({}, mockRes(), next);

    setTimeout(() => {
        check('asyncHandler: thrown error is forwarded to next()', !!forwardedError);
        check(
            'asyncHandler: correct error message is preserved',
            forwardedError && forwardedError.message === 'Simulated database failure'
        );
        runTest7();
    }, 20);
}

// ---------- Test 7: errorHandler formats a validation-style error correctly ----------
function runTest7() {
    const apiErrorHandler = require('./app_api/middleware/errorHandler');

    const err = { status: 400, message: 'Trip request is missing required field(s): length, resort' };
    const res = mockRes();

    apiErrorHandler(err, {}, res, () => {});

    check('errorHandler: uses the error status code', res.statusCode === 400);
    check('errorHandler: uses the error message', res.body && res.body.message === err.message);

    // ---------- Summary ----------
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
}
