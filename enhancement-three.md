# Enhancement Three: Databases

[← Back to home](README.md)

[Read the full narrative (Word document)](narratives/CS-499-Milestone-Four-Narrative-Haun.docx)

## Artifact Description

This enhancement focuses on the MongoDB/Mongoose data layer of Travlr Getaways, specifically `travlr.js` and `user.js`, the Mongoose schemas for trips and users, and the password-handling logic defined on the user schema.

**Code:** the most relevant before/after changes are shown inline below. To view just the files related to this enhancement, see [enhancement three files](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/enhancement-files/enhancement-three). To browse the complete files in context, see [the original version](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/original/travlr/app_api/models) or [the enhanced version](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/enhanced/travlr/app_api/models).

## Justification for Inclusion

The Milestone One code review identified three concrete weaknesses in the data layer: the `perPerson` field was typed as a String even though it represents a price, the password hashing used a PBKDF2 iteration count far below current guidance, and there was no role field anywhere on the user schema, meaning any authenticated user, not just an administrator, could add or edit trips.

**The artifact was improved with the following changes:**

- Changed `perPerson` from a String to a Number in the trip schema, so the database itself enforces the correct type.
- Added a `role` field to the user schema, constrained to `'user'` or `'admin'`, defaulting to `'user'`. The registration handler constructs a new user from an explicit list of fields, never a raw copy of the request body, so a client can never self-assign the admin role.
- Added a `requireRole` middleware, wired into both `POST /trips` and `PUT /trips/:tripCode`, so only admin users can add or edit trips.
- Increased the PBKDF2 iteration count from 1,000 to 210,000, meeting OWASP's current Password Storage Cheat Sheet guidance.
- Stored the iteration count per user rather than assuming one globally, so raising this number does not lock out any account hashed under the previous value.
- Added the `role` claim to the JWT payload so route middleware can check a user's role directly from the token.
- Found and fixed a related defect: the `PUT /trips/:tripCode` route was missing input validation entirely. Because that route is designed to support partial updates, the fix required a purpose-built validator that only checks whatever fields are actually present, rather than reusing the strict, all-fields-required validator built for creating a new trip.

## Before and After

**`perPerson` typing in `travlr.js`**

Before:
```javascript
perPerson: { type: String, required: true },
```

After:
```javascript
perPerson: { type: Number, required: true },
```

**Password hashing and access control in `user.js`**

Before, iterations were hardcoded at 1,000 and there was no role field anywhere on the schema:

```javascript
userSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt,
        1000, 64, 'sha512').toString('hex');
};
```

After, the iteration count is a named constant, stored per user, with a legacy fallback in `validPassword`, and a `role` field now exists on the schema:

```javascript
const PBKDF2_ITERATIONS = 210000;

// ...on the schema:
iterations: {
    type: Number,
    required: true,
    default: PBKDF2_ITERATIONS
},
role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
}

// Set password
userSchema.methods.setPassword = function(password){
    this.salt = crypto.randomBytes(16).toString('hex');
    this.iterations = PBKDF2_ITERATIONS;
    this.hash = crypto.pbkdf2Sync(password, this.salt,
        this.iterations, 64, 'sha512').toString('hex');
};

// Check password
userSchema.methods.validPassword = function(password) {
    // Falls back to 1000 for any existing user whose document
    // predates the iterations field.
    const iterations = this.iterations || 1000;
    const hash = crypto.pbkdf2Sync(password,
        this.salt, iterations, 64, 'sha512').toString('hex');
    return this.hash === hash;
};
```

*[View the full file, before](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/original/travlr/app_api/models/user.js) · [after](https://github.com/AlexanderHaun2/AlexanderHaun2.github.io/tree/main/enhanced/travlr/app_api/models/user.js)*

## Example Output

**A non-admin user attempting to add a trip: `POST /api/trips`, valid token, role `"user"`**
```
403 Forbidden
{
  "message": "Requires admin role"
}
```

**Partial update: `PUT /api/trips/BALI01`, admin token, only `perPerson` included**
```json
{ "perPerson": 1899 }
```
Result: only `perPerson` changes. Every other field is left exactly as it was, since `findOneAndUpdate` strips any field the request does not include.

**Actual output from the verification script**
```
PASS: perPerson field is typed as Number 
PASS: a numeric string passed in is cast to a real Number 
PASS: role field defaults to "user" 
PASS: role field is constrained to user/admin via enum 
PASS: a new user instance defaults to role "user" 
PASS: constructing a user the way register() does ignores a client-supplied role 
PASS: setPassword stores 210000 iterations for a new user 
PASS: validPassword returns true for the correct password 
PASS: validPassword returns false for an incorrect password 
PASS: a legacy 1000-iteration user can still log in after the migration 
PASS: a legacy user still correctly rejects a wrong password 
PASS: generateJWT includes the role claim 
PASS: requireRole allows a request with the correct role through 
PASS: requireRole blocks a non-admin user 
PASS: requireRole blocks a token with no role claim (pre-enhancement tokens) 
PASS: requireRole does not throw when req.auth is missing entirely 
PASS: partial update: a single valid field is accepted 
PASS: partial update: an empty request body is rejected 
PASS: partial update: an invalid perPerson is still rejected 
PASS: partial update: updating only the name field is accepted 
  
20 passed, 0 failed 
```

## Course Outcomes

The Module One plan identified two outcomes: developing a security mindset that anticipates adversarial exploits, and designing and evaluating computing solutions while managing design trade-offs. Both were met. The security mindset outcome is demonstrated by role-based access control and the password hashing fix, specifically the deliberate registration design that prevents a client from self-assigning a privileged role. The trade-off outcome is demonstrated by the per-user iteration count design, trading a small amount of schema complexity for the ability to raise password security in the future without locking out existing accounts.

## Reflection

The main design challenge was avoiding a problem that is easy to overlook: simply raising the PBKDF2 iteration count would have silently broken login for every existing user. Storing the iteration count per user, with a tested fallback for legacy accounts, solved this directly. A second lesson came from the validation fix: my first pass would have broken an existing, intentional design choice, that the update route only requires the fields actually being changed. That was caught before this milestone was finalized, a reminder that a fix which passes its own tests can still be wrong if it does not account for how the surrounding code was actually meant to behave.

---

[← Back to home](README.md)
