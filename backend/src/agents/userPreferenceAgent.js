/**
 * ─────────────────────────────────────────────────────────────
 *  User Preference Agent
 * ─────────────────────────────────────────────────────────────
 *  Handles all CRUD operations on user preferences.
 *  Called by the Express routes layer.
 */

const User = require('../models/User');
const logger = require('../config/logger');

/**
 * Create a new user with job preferences.
 * @param {object} data
 * @returns {Promise<User>}
 */
const createUser = async (data) => {
  logger.info(`[UserPreferenceAgent] Creating user: ${data.email}`);
  const user = new User(data);
  await user.save();
  logger.info(`[UserPreferenceAgent] User created: ${user._id}`);
  return user;
};

/**
 * Return all users (optionally filtered by active status).
 * @param {object} query  – Mongoose filter e.g. { active: true }
 * @returns {Promise<User[]>}
 */
const getAllUsers = async (query = {}) => {
  return User.find(query).sort({ createdAt: -1 });
};

/**
 * Find a single user by ID.
 * @param {string} id
 * @returns {Promise<User|null>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Update user preferences by ID.
 * Only the fields provided in `data` will be updated.
 * @param {string} id
 * @param {object} data
 * @returns {Promise<User|null>}
 */
const updateUser = async (id, data) => {
  logger.info(`[UserPreferenceAgent] Updating user: ${id}`);
  const user = await User.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true }
  );
  if (user) logger.info(`[UserPreferenceAgent] User updated: ${id}`);
  return user;
};

/**
 * Soft-delete (deactivate) or hard-delete a user.
 * @param {string}  id
 * @param {boolean} hard  – If true, removes from DB; otherwise sets active=false
 * @returns {Promise<User|null>}
 */
const deleteUser = async (id, hard = false) => {
  if (hard) {
    logger.info(`[UserPreferenceAgent] Hard-deleting user: ${id}`);
    return User.findByIdAndDelete(id);
  }
  logger.info(`[UserPreferenceAgent] Deactivating user: ${id}`);
  return User.findByIdAndUpdate(id, { $set: { active: false } }, { new: true });
};

/**
 * Find all active users whose notifyTime matches the given HH:MM string.
 * Called by the Scheduler Agent each minute.
 * @param {string} time  – "HH:MM"
 * @returns {Promise<User[]>}
 */
const getUsersDueAt = async (time) => {
  return User.find({ notifyTime: time, active: true });
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUsersDueAt,
};
