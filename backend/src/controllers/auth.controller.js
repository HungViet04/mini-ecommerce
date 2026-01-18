/**
 * Auth Controller
 * Handles authentication HTTP requests
 */
const { authService } = require('../services');
const { response } = require('../helpers');
const { asyncHandler } = require('../helpers/async.helper');

/**
 * Register new user
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  return response.created(res, user, 'Đăng ký thành công');
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  return response.success(res, {
    data: result,
    message: 'Đăng nhập thành công',
  });
});

/**
 * Get current user profile
 * GET /api/v1/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  return response.success(res, {
    data: profile,
  });
});

/**
 * Change password
 * PUT /api/v1/auth/password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.id, currentPassword, newPassword);
  return response.success(res, {
    message: 'Đổi mật khẩu thành công',
  });
});

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
};
