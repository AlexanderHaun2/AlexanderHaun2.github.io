// Restricts a route to users whose JWT includes a specific role.
//
// This must run after authenticateJWT, since it depends on req.auth
// already having been set from a verified token. Tokens issued before
// this enhancement do not carry a role claim at all, so req.auth.role
// will be undefined for those, which will correctly fail.
function requireRole(role) {
    return function (req, res, next) {
        if (!req.auth || req.auth.role !== role) {
            return res.status(403).json({ message: `Requires ${role} role` });
        }
        next();
    };
}

module.exports = requireRole;
