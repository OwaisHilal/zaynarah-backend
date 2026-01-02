// backend/src/features/notifications/notifications.worker.js
const {
  Worker,
  connection,
  logger,
  emailsQueue,
} = require('../../services/queue.service');
const notificationsService = require('./notifications.service');
const { sendToUser } = require('./notifications.sse');

new Worker(
  'notifications',
  async (job) => {
    if (!job || job.name !== 'create-notification') return;

    const data = job.data;
    if (!data || !data.userId || !data.type) {
      logger.warn('Invalid notification job payload', {
        jobId: job?.id,
      });
      return;
    }

    const notification = await notificationsService.create(data);

    if (!notification) return;

    sendToUser(notification.user.toString(), {
      type: 'notification:new',
      payload: notification,
    });

    await emailsQueue.add('send-notification-email', notification.toObject(), {
      removeOnComplete: true,
      removeOnFail: 50,
      jobId: `email:${notification._id}`,
    });
  },
  connection
).on('failed', (job, err) => {
  logger.error('Notification job failed', {
    jobId: job?.id,
    error: err?.message,
  });
});
