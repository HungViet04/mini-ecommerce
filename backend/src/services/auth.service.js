/**
 * Auth Service
 * Handles authentication business logic
 * Vietnamese messages
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { userRepository } = require('../repositories');
const { AuthenticationError, ConflictError } = require('../errors');
const { validateRegister, validateLogin } = require('../validators/auth.validator');

class AuthService {
  /**
   * Register a new user
   * @param {Object} data - Registration data
   * @returns {Promise<Object>} Created user (without password)
   */
  async register(data) {
    // Validate input
    const validatedData = validateRegister(data);

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(validatedData.email);
    if (existingUser) {
      throw new ConflictError('Email này đã được sử dụng');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, config.bcrypt.saltRounds);

    // Create user
        const user = await userRepository.createUser({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
      role: 'user',
        });

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Login user
   * @param {Object} data - Login data
   * @returns {Promise<Object>} Tokens
   */
  async login(data) {
    // Validate input
    const validatedData = validateLogin(data);

    // Find user by identifier (email or username)
    const user = await userRepository.findByIdentifier(validatedData.identifier);
    if (!user) {
      throw new AuthenticationError('Email hoặc mật khẩu không chính xác');
    }


    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Email hoặc mật khẩu không chính xác');
    }

    // Generate token
    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * Get user profile
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
  const user = await userRepository.findByIdOrFail(userId, 'User');
    const { password, ...profile } = user;
    return profile;
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await userRepository.findByIdOrFail(userId, 'User');

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AuthenticationError('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
    // Update password
    await userRepository.updatePassword(userId, hashedPassword);
    return true;
  }

  /**
   * Generate access token
   * @param {Object} user - User object
   * @returns {string} Access token
   */
  generateAccessToken(user) {
    return jwt.sign(
      { id: user.id, role: user.role },
      config.jwt.accessSecret,
      { expiresIn: config.jwt.accessExpiresIn }
    );
  }
}

// Export singleton instance
module.exports = new AuthService();
