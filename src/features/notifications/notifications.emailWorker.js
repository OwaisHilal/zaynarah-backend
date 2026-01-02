//backend/src/features/notifications/notifications.emailWorker.js
const { Worker, connection, logger } = require('../../services/queue.service');
const User = require('../users/users.model');
const emailRules = require('./notifications.emailRules');
const { sendNotificationEmail } = require('../../services/mailer.service');

new Worker(
  'emails',
  async (job) => {
    const notification = job.data;
    const rule = emailRules[notification.type];

    if (!rule || !rule.sendEmail) return;

    const user = await User.findById(notification.user).lean();
    if (!user || !user.email) return;

    if (!rule.roles.includes(user.role)) return;

    await sendNotificationEmail({
      to: user.email,
      subject: notification.title,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });
  },
  connection
).on('failed', (job, err) => {
  logger.error('Email notification failed', {
    jobId: job.id,
    error: err.message,
  });
});
