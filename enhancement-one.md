# Enhancement One: Software Design and Engineering

[← Back to home](README.md)

[Read the full narrative (Word document)](narratives/CS-499-Milestone-Two-Narrative-Haun.docx)

## Artifact Description

The artifact enhanced here is Travlr Getaways, a full stack travel booking web application originally built in CS 465: Full Stack Development I and completed in the May–June 2026 term. The application consists of an Express and Node.js backend, public-facing views rendered with Handlebars, a RESTful API layer, a separate Angular single-page application for trip administration, MongoDB data storage accessed through Mongoose, and JSON Web Token authentication implemented with Passport.js. This enhancement focuses on the Express backend, the API routing layer, and the authentication middleware.

**Code:** the most relevant before/after changes are shown inline below. This enhancement changes `app.js`, `authentication.js`, `edit-trip.component.ts`, `index.js`, `trip-data.service.ts`, and `trips.js`. It also adds `asyncHandler.js`, `errorHandler.js`, `test_enhancements.js`, and `validateTrip.js`. To browse the complete files, see [the original version](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/original/travlr/app_api) or [the enhanced version](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/enhanced/travlr/app_api).

## Justification for Inclusion

Travlr Getaways was selected because it is a genuine full stack application spanning the client, server, and database layers within a single codebase, which lets all three ePortfolio categories draw from one project rather than three disconnected exercises. The Milestone One code review identified several concrete weaknesses:

- The JWT authentication middleware called `next()` immediately after starting an asynchronous token verification, instead of waiting for that verification to complete, which allowed requests with invalid or expired tokens to reach protected routes.
- A related defect in the same function chained `.json()` onto `res.sendStatus()`, which had already ended the response, making that error path invalid as well.
- Four controller methods across `trips.js` and `authentication.js` referenced an undefined `err` variable in their error branches. Since this project runs on Express 4, which does not automatically catch errors thrown inside async route handlers, an unhandled rejection in any of these methods risked crashing the process rather than returning a clean error response.
- The trip update route relied on Mongoose's `findOneAndUpdate`, which does not run schema validation by default, leaving update requests with no data validation at all.

**The artifact was improved with the following changes:**

- Rewrote the JWT middleware so `next()` is only called from inside the verification callback, once a token is confirmed valid, and corrected the broken response chain on the failure path.
- Added an `asyncHandler` utility that wraps every async controller method, forwarding any thrown error or rejected promise to a centralized error handler instead of letting it become an unhandled rejection.
- Added a centralized `apiErrorHandler` middleware, mounted on the `/api` route, that formats every error from the API as a single, consistent JSON response, including Mongoose validation errors and MongoDB duplicate-key errors.
- Added a `validateTrip` middleware that checks required trip fields and validates `perPerson` before a request reaches the database.
- Added the `runValidators` option to `findOneAndUpdate` so trip updates are now validated against the schema.
- Fixed a defect in the application's top-level error handler where a request to an unmatched route could hang indefinitely instead of returning any response.

## Before and After

**The core fix: `authenticateJWT` in `app_api/routes/index.js`**

BEFORE: `next()` ran immediately after starting an asynchronous token verification, so a request could reach the protected route before the token was actually checked:

```javascript
jwt.verify(token, process.env.JWT_SECRET, (err, verified) => {
    if (err) {
        return res.sendStatus(401).json('Token Validation Error!');
    }
    req.auth = verified;
});
next(); // ran regardless of whether verification above had finished
```

AFTER: `next()` only runs from inside the callback, once verification has actually completed:

```javascript
jwt.verify(token, process.env.JWT_SECRET, (err, verified) => {
    if (err) {
        return res.status(401).json({ message: 'Token validation error' });
    }
    req.auth = verified;
    next(); // only reached once the token is confirmed valid
});
```

*[View the full file, before](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/original/travlr/app_api/routes/index.js) · [after](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/enhanced/travlr/app_api/routes/index.js)*

## Example Output

**Adding a trip with an invalid or missing token: `POST /api/trips`**
```
401 Unauthorized
{
  "message": "Token validation error"
}
```
Before this enhancement, `next()` was called before token verification finished, so a request like this could reach the protected route handler regardless of whether the token was actually valid.

**Registering with an email already in use: `POST /api/register`**

Before the fix:
```
500 Internal Server Error
{
  "message": "E11000 duplicate key error collection: travlr.users index: email_1 dup key: { email: \"example@example.com\" }"
}
```
After the fix:
```
409 Conflict
{
  "message": "A record with that value already exists."
}
```

## Course Outcomes

The Module One plan identified two course outcomes for this enhancement: developing a security mindset that anticipates adversarial exploits and mitigates design flaws, and demonstrating the ability to use well-founded and innovative techniques and tools to implement solutions that deliver value. Both were met. The security mindset outcome is demonstrated by identifying and correcting a genuine authentication bypass and adding validation that rejects malformed data before it reaches the database. The well-founded techniques outcome is demonstrated by the `asyncHandler` and centralized error-handling pattern, a standard, widely used approach for Express applications, verified with automated tests rather than manual spot-checking.

## Reflection

This enhancement deepened my understanding of asynchronous control flow in Node.js and why Express 4 does not automatically catch errors thrown inside async route handlers. I also learned that Mongoose's `findOneAndUpdate` skips schema validation unless explicitly told to run it. The main challenge was verifying the fixes without a live database connection in my working environment at the time; I addressed this by writing isolated unit tests using mocked request, response, and next objects, which let me confirm the exact behavior of each fix directly, then later confirmed the same behavior through live integration testing against a running MongoDB instance.

---

[← Back to home](README.md)
