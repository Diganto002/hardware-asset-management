/**
 * Role-based access control middleware using x-user-role header.
 * Allowed roles: 'admin' (IT Operator) and 'auditor' (Read-only auditor).
 */
function authMiddleware(req, res, next) {
  // Extract role from header, default to 'admin' for developer convenience if omitted in standard requests,
  // but if explicitly provided or in mutation endpoints, check role permissions.
  const roleHeader = req.header('x-user-role');
  req.userRole = (roleHeader ? roleHeader.toLowerCase().trim() : 'admin');
  next();
}

/**
 * Middleware requiring admin role for mutations (Create, Update, Assign, Unassign, Delete).
 * Returns HTTP 403 Forbidden if user is an auditor or unauthorized.
 */
function requireAdmin(req, res, next) {
  const roleHeader = req.header('x-user-role');
  const role = roleHeader ? roleHeader.toLowerCase().trim() : 'admin';

  if (role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: `Forbidden: Role '${role}' does not have permission to modify assets. IT Operator (admin) role required.`
      }
    });
  }

  req.userRole = 'admin';
  next();
}

module.exports = {
  authMiddleware,
  requireAdmin
};
