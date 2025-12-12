// src/features/shipping/shipping.service.js
/**
 * Enhanced shipping service:
 * - returns shipping methods based on address (country, state, postalCode)
 * - considers weight (grams) and itemsCount for cost calculation
 * - calculateShippingCost(method, { weight, itemsCount })
 *
 * This is intentionally simple but demonstrates how to incorporate more rules.
 */

const ApiError = require('../../core/errors/ApiError');

module.exports = {
  /**
   * Return available shipping methods for an address (best-effort).
   * address: { city, state, country, postalCode, ... }
   * opts: { weight, itemsCount }
   */
  getShippingMethods: async (address = {}, opts = {}) => {
    const country = (address.country || 'India').toString().toLowerCase();
    const state = (address.state || '').toString().toLowerCase();
    const postalCode = (address.postalCode || '').toString();

    // default rates - base cost per method
    const IN_BASE = { standard: 50, express: 120 };
    const INTL_BASE = { intl_economy: 800, intl_express: 2000 };

    // Helper to compute dynamic cost
    const computeCost = (base) => {
      let cost = Number(base || 0);

      // if weight provided, increase cost: every 500g adds 10% of base
      const weight = Number(opts.weight || 0);
      if (weight > 0) {
        const increments = Math.floor(weight / 500);
        cost += Math.round(cost * 0.1 * increments);
      }

      // itemsCount surcharge (small)
      const items = Number(opts.itemsCount || 0);
      if (items > 3) cost += (items - 3) * 10;

      // remote postal code surcharge (example: codes starting with 9)
      if (/^9/.test(postalCode)) cost += 50;

      // state-based surcharge sample (example)
      if (state === 'remote-state') cost += 80;

      return cost;
    };

    if (country === 'india' || country === 'in') {
      return [
        {
          _id: 'standard',
          label: 'Standard Shipping',
          cost: computeCost(IN_BASE.standard),
          deliveryEstimate: '3-6 business days',
          carrier: 'LocalCourier',
        },
        {
          _id: 'express',
          label: 'Express Shipping',
          cost: computeCost(IN_BASE.express),
          deliveryEstimate: '1-2 business days',
          carrier: 'LocalExpress',
        },
      ];
    }

    // International fallback uses weight more aggressively
    return [
      {
        _id: 'intl_economy',
        label: 'International Economy',
        cost: computeCost(INTL_BASE.intl_economy),
        deliveryEstimate: '10-20 business days',
        carrier: 'IntlCarrier',
      },
      {
        _id: 'intl_express',
        label: 'International Express',
        cost: computeCost(INTL_BASE.intl_express),
        deliveryEstimate: '3-7 business days',
        carrier: 'IntlExpress',
      },
    ];
  },

  /**
   * Calculate shipping cost from a chosen method object (or id).
   * method: object or id string
   * opts: { weight, itemsCount }
   */
  calculateShippingCost: async (method, opts = {}) => {
    if (!method) return 0;

    if (typeof method === 'object') {
      // base cost plus adjustments
      const base = Number(method.cost || 0);
      const weight = Number(opts.weight || 0);
      let cost = base;
      if (weight > 0) {
        const increments = Math.floor(weight / 500);
        cost += Math.round(base * 0.1 * increments);
      }
      const items = Number(opts.itemsCount || 0);
      if (items > 3) cost += (items - 3) * 10;

      return Number(cost);
    }

    // string id mapping fallback
    const map = {
      standard: 50,
      express: 120,
      intl_economy: 800,
      intl_express: 2000,
    };
    const base = Number(map[method] || 0);
    const weight = Number(opts.weight || 0);
    let cost = base;
    if (weight > 0) {
      const increments = Math.floor(weight / 500);
      cost += Math.round(base * 0.1 * increments);
    }
    const items = Number(opts.itemsCount || 0);
    if (items > 3) cost += (items - 3) * 10;

    return Number(cost);
  },
};
