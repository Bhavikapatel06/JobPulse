/**
 * ─────────────────────────────────────────────────────────────
 *  Notification Service – Future-Ready Stub
 * ─────────────────────────────────────────────────────────────
 *  Currently a no-op placeholder.
 *
 *  How to add a notification channel later:
 *    1. Implement the relevant method (sendEmail, sendWhatsApp, etc.)
 *    2. Add it to the `dispatch()` switch/router.
 *    3. No changes needed anywhere else in the codebase.
 *
 *  The Report Generation Agent always calls dispatch(user, reportData)
 *  so the pipeline is fully wired – just activate the channel here.
 */

const logger = require('../config/logger');

/**
 * Send an email notification.
 * TODO: Implement with nodemailer / SendGrid / SES etc.
 *
 * @param {object} user
 * @param {object} reportData
 */
const sendEmail = async (user, reportData) => {
  // Example implementation (nodemailer):
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ to: user.email, subject: '...', html: template(reportData) });
  logger.debug(`[NotificationService] sendEmail() – not yet implemented for ${user.email}`);
};

/**
 * Send a WhatsApp notification.
 * TODO: Implement with Twilio / WhatsApp Business API etc.
 *
 * @param {object} user
 * @param {object} reportData
 */
const sendWhatsApp = async (user, reportData) => {
  // Example implementation (Twilio):
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({ to: `whatsapp:${user.phone}`, from: '...', body: format(reportData) });
  logger.debug(`[NotificationService] sendWhatsApp() – not yet implemented for ${user.email}`);
};

/**
 * Send a Slack notification.
 * TODO: Implement with @slack/web-api or Incoming Webhooks.
 *
 * @param {object} user
 * @param {object} reportData
 */
const sendSlack = async (user, reportData) => {
  logger.debug(`[NotificationService] sendSlack() – not yet implemented for ${user.email}`);
};

/**
 * Main dispatcher – called by the Report Generation Agent after every report.
 * Routes to the appropriate channel(s) based on user settings or env config.
 *
 * @param {object} user
 * @param {object} reportData  – Plain object from reportGenerationAgent.generateReportData()
 */
const dispatch = async (user, reportData) => {
  // Currently terminal-only. To enable a channel, uncomment the relevant line:
  // await sendEmail(user, reportData);
  // await sendWhatsApp(user, reportData);
  // await sendSlack(user, reportData);

  logger.info(
    `[NotificationService] Report dispatched for ${user.name} ` +
    `(${reportData.summary?.totalJobs ?? 0} jobs) – terminal only`
  );
};

module.exports = { dispatch, sendEmail, sendWhatsApp, sendSlack };
