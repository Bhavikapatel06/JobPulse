/**
 * Time utilities for the scheduler agent.
 */

/**
 * Returns the current local time formatted as "HH:MM" (24-hour clock).
 * This is used by the scheduler to match against user notifyTime values.
 *
 * @returns {string}  e.g. "09:30", "14:05"
 */
const getCurrentHHMM = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

/**
 * Returns a human-readable datetime string for reports.
 * @returns {string}  e.g. "Jul 24, 2026, 9:30 AM"
 */
const getFormattedDateTime = () => {
  return new Date().toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

/**
 * Checks whether a given Date is older than N hours.
 * @param {Date}   date
 * @param {number} hours
 * @returns {boolean}
 */
const isOlderThan = (date, hours) => {
  if (!date) return true;
  const ageMs = Date.now() - new Date(date).getTime();
  return ageMs > hours * 60 * 60 * 1000;
};

module.exports = { getCurrentHHMM, getFormattedDateTime, isOlderThan };
