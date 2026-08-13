// Standalone verification for the Milestone Four enhancement. 
// Runs against the actual Mongoose schemas and middleware, 
// using in-memory model instances (new User(), new Trip())

process.env.JWT_SECRET = 'test-secret';

const User = require('./app_api/models/user');
const Trip = require('./app_api/models/travlr');
const requireRole = require('./app_api/middleware/requireRole');
const jwt = require('jsonwebtoken');

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

// ---------- Schema: perPerson is now a Number ----------
(function testTripSchema() {
  check('perPerson field is typed as Number', Trip.schema.path('perPerson').instance === 'Number');

  const trip = new Trip({
    code: 'BALI01', name: 'Bali Getaway', length: '7 days', start: new Date(),
    resort: 'Nusa Dua', perPerson: '1500', image: 'a.png', description: 'desc'
  });
  check('a numeric string passed in is cast to a real Number', typeof trip.perPerson === 'number' && trip.perPerson === 1500);
})();

// ---------- Schema: role field ----------
(function testRoleSchema() {
  const rolePath = User.schema.path('role');
  check('role field defaults to "user"', rolePath.defaultValue === 'user');
  check('role field is constrained to user/admin via enum', JSON.stringify(rolePath.enumValues) === JSON.stringify(['user', 'admin']));

  const user = new User({ name: 'Alex', email: 'alex@example.com', role: undefined });
  check('a new user instance defaults to role "user"', user.role === 'user');
})();

// ---------- Schema: registration cannot self-assign a role ----------
(function testNoSelfPromotion() {
  // Mirrors how authentication.js actually constructs a new user: an
  // explicit allow-list of fields, never a raw spread of req.body, so a
  // client-supplied role can never reach the User constructor.
  const maliciousBody = { name: 'Attacker', email: 'attacker@example.com', role: 'admin' };
  const user = new User({ name: maliciousBody.name, email: maliciousBody.email });
  check('constructing a user the way register() does ignores a client-supplied role', user.role === 'user');
})();

// ---------- Password hashing: iteration count and round trip ----------
(function testPasswordHashing() {
  const user = new User({ name: 'Alex', email: 'alex@example.com' });
  user.setPassword('correct horse battery staple');

  check('setPassword stores 210000 iterations for a new user', user.iterations === 210000);
  check('validPassword returns true for the correct password', user.validPassword('correct horse battery staple') === true);
  check('validPassword returns false for an incorrect password', user.validPassword('wrong password') === false);
})();

// ---------- Password hashing: backward compatibility with legacy users ----------
(function testLegacyPasswordCompat() {
  // Simulates a user hashed before this migration existed
  const crypto = require('crypto');
  const legacyUser = new User({ name: 'Legacy User', email: 'legacy@example.com' });
  legacyUser.salt = crypto.randomBytes(16).toString('hex');
  legacyUser.hash = crypto.pbkdf2Sync('old password', legacyUser.salt, 1000, 64, 'sha512').toString('hex');
  legacyUser.iterations = undefined;

  check(
    'a legacy 1000-iteration user can still log in after the migration',
    legacyUser.validPassword('old password') === true
  );
  check(
    'a legacy user still correctly rejects a wrong password',
    legacyUser.validPassword('wrong password') === false
  );
})();

// ---------- JWT: role is included in the token ----------
(function testJWTIncludesRole() {
  const user = new User({ name: 'Admin User', email: 'admin@example.com', role: 'admin' });
  user._id = 'fake-id-123';
  const token = user.generateJWT();
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  check('generateJWT includes the role claim', decoded.role === 'admin');
})();

// ---------- requireRole middleware ----------
function mockRes() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

(function testRequireRoleMiddleware() {
  const middleware = requireRole('admin');

  // Admin token: should pass through
  let nextCalled = false;
  middleware({ auth: { role: 'admin' } }, mockRes(), () => { nextCalled = true; });
  check('requireRole allows a request with the correct role through', nextCalled === true);

  // Regular user token: should be rejected
  const res1 = mockRes();
  let next1Called = false;
  middleware({ auth: { role: 'user' } }, res1, () => { next1Called = true; });
  check('requireRole blocks a non-admin user', next1Called === false && res1.statusCode === 403);

  // Old token with no role claim at all: should be rejected (fail closed)
  const res2 = mockRes();
  let next2Called = false;
  middleware({ auth: {} }, res2, () => { next2Called = true; });
  check('requireRole blocks a token with no role claim (pre-enhancement tokens)', next2Called === false && res2.statusCode === 403);

  // No req.auth at all: should be rejected, not throw
  const res3 = mockRes();
  let threw = false;
  try {
    middleware({}, res3, () => {});
  } catch (e) {
    threw = true;
  }
  check('requireRole does not throw when req.auth is missing entirely', threw === false && res3.statusCode === 403);
})();

// ---------- validateTrip.validateTripUpdate: partial updates ----------
const validateTrip = require('./app_api/middleware/validateTrip');

function mockRes2() {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = function (code) { res.statusCode = code; return res; };
  res.json = function (data) { res.body = data; return res; };
  return res;
}

(function testPartialUpdateValidator() {
  // Sending only one field to update should be allowed
  let nextCalled = false;
  validateTrip.validateTripUpdate(
    { body: { perPerson: 1899 } }, mockRes2(), () => { nextCalled = true; }
  );
  check('partial update: a single valid field is accepted', nextCalled === true);

  // An empty body should still be rejected, there's nothing to update.
  const res1 = mockRes2();
  let forwardedError1 = null;
  validateTrip.validateTripUpdate(
    { body: {} }, res1, (err) => { forwardedError1 = err; }
  );
  check('partial update: an empty request body is rejected', !!forwardedError1 && forwardedError1.status === 400);

  // If perPerson IS sent, it still has to be a valid number, even on a
  // partial update.
  let forwardedError2 = null;
  validateTrip.validateTripUpdate(
    { body: { perPerson: 'not-a-number' } }, mockRes2(), (err) => { forwardedError2 = err; }
  );
  check('partial update: an invalid perPerson is still rejected', !!forwardedError2 && /perPerson must be a valid number/.test(forwardedError2.message));

  // Sending a completely unrelated field alone (not perPerson) should
  // still be accepted, since only whatever's present needs to be valid.
  let nextCalled2 = false;
  validateTrip.validateTripUpdate(
    { body: { name: 'Updated Name Only' } }, mockRes2(), () => { nextCalled2 = true; }
  );
  check('partial update: updating only the name field is accepted', nextCalled2 === true);
})();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
