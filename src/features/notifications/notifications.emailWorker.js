// backend/src/features/notifications/notifications.emailWorker.js
const { Worker, connection, logger } = require('../../services/queue.service');
const User = require('../users/users.model');
const emailRules = require('./notifications.emailRules');
const { sendNotificationEmail } = require('../../services/mailer.service');

new Worker(
  'emails',
  async (job) => {
    const notification = job.data;

    const rule = emailRules[notification.type] || emailRules.__default;
    if (!rule.sendEmail) return;

    const user = await User.findById(notification.user).lean();
    if (!user || !user.email) return;

    if (
      Array.isArray(rule.roles) &&
      rule.roles.length > 0 &&
      !rule.roles.includes(user.role)
    ) {
      return;
    }

    let attachments = [];

    if (notification.type === 'ORDER_INVOICE_EMAIL') {
      const invoiceService = require('../orders/services/invoice.service');
      const pdfBuffer = await invoiceService.generateInvoicePdf(
        notification.entityId
      );

      attachments.push({
        filename: `invoice-${notification.entityId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    }

    await sendNotificationEmail({
      to: user.email,
      subject: notification.title,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
      attachments,
    });
  },
  connection
).on('failed', (job, err) => {
  logger.error('Email notification failed', {
    jobId: job.id,
    error: err.message,
  });
});
