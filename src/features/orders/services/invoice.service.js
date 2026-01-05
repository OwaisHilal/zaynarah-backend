// backend/src/features/orders/services/invoice.service.js
const Order = require('../orders.model');
const ApiError = require('../../../core/errors/ApiError');
const puppeteer = require('puppeteer');

function formatCurrency(value, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(value);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildInvoiceHtml(order) {
  const items = order.items || [];
  const totals = order.cartTotal || {};
  const billing = order.billingAddress || {};

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${order._id}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 40px;
      color: #111827;
    }
    .invoice {
      max-width: 800px;
      margin: auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 16px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .brand h1 {
      margin: 0;
      font-size: 28px;
    }
    .brand p {
      margin: 4px 0 0;
      color: #6b7280;
    }
    .meta {
      text-align: right;
      font-size: 14px;
      color: #374151;
    }
    h2 {
      font-size: 18px;
      margin: 32px 0 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      text-align: left;
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
    }
    .totals {
      margin-top: 24px;
      width: 100%;
      max-width: 360px;
      margin-left: auto;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .totals .grand {
      font-size: 18px;
      font-weight: 700;
      border-top: 2px solid #111827;
      padding-top: 12px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 48px;
      font-size: 13px;
      color: #6b7280;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">
        <h1>Zaynarah</h1>
        <p>Handcrafted luxury from Kashmir</p>
      </div>
      <div class="meta">
        <div>Invoice #${order._id}</div>
        <div>${new Date(order.createdAt).toLocaleDateString('en-IN')}</div>
        <div>Status: ${escapeHtml(order.paymentStatus)}</div>
      </div>
    </div>

    <h2>Billing Address</h2>
    <p>
      ${escapeHtml(billing.fullName)}<br/>
      ${escapeHtml(billing.addressLine1)}<br/>
      ${escapeHtml(billing.addressLine2)}<br/>
      ${escapeHtml(billing.city)} ${escapeHtml(billing.postalCode)}<br/>
      ${escapeHtml(billing.country)}
    </p>

    <h2>Items</h2>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${items
          .map(
            (i) => `
          <tr>
            <td>${escapeHtml(i.title)}</td>
            <td>${i.qty}</td>
            <td>${formatCurrency(i.price, totals.currency)}</td>
            <td>${formatCurrency(i.price * i.qty, totals.currency)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>

    <div class="totals">
      <div>
        <span>Subtotal</span>
        <span>${formatCurrency(totals.items || 0, totals.currency)}</span>
      </div>
      <div>
        <span>Shipping</span>
        <span>${formatCurrency(totals.shipping || 0, totals.currency)}</span>
      </div>
      <div>
        <span>Tax</span>
        <span>${formatCurrency(totals.tax || 0, totals.currency)}</span>
      </div>
      <div class="grand">
        <span>Total</span>
        <span>${formatCurrency(totals.grand || 0, totals.currency)}</span>
      </div>
    </div>

    <div class="footer">
      Thank you for shopping with Zaynarah.<br/>
      This invoice is generated electronically and is valid without a signature.
    </div>
  </div>
</body>
</html>
`;
}

module.exports = {
  generateInvoiceHtml: async (orderId) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');
    return buildInvoiceHtml(order);
  },

  generateInvoicePdf: async (orderId) => {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new ApiError(404, 'Order not found');

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(buildInvoiceHtml(order), {
      waitUntil: 'networkidle0',
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();
    return pdf;
  },
};
