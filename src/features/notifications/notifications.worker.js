//backend/src/features/notifications/notifications.worker.js
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
    if (job.name !== 'create-notification') return;

    const notification = await notificationsService.create(job.data);

    sendToUser(notification.user.toString(), {
      type: 'notification:new',
      payload: notification,
    });

    await emailsQueue.add('send-notification-email', notification.toObject(), {
      removeOnComplete: true,
      removeOnFail: 50,
    });
  },
  connection
).on('failed', (job, err) => {
  logger.error('Notification job failed', {
    jobId: job.id,
    error: err.message,
  });
});
