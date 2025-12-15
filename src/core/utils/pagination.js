/**
 * Reusable function to fetch paginated data from a Mongoose model.
 *
 * @param {object} Model - The Mongoose Model (e.g., Product, User, Post).
 * @param {object} query - The Mongoose filter criteria (e.g., { category: 'Electronics' }).
 * @param {object} options - Pagination and sorting options.
 * @param {number} options.page - The current page number (1-based).
 * @param {number} options.limit - The number of items per page.
 * @param {object} options.sortOptions - The Mongoose sort object (e.g., { createdAt: -1 }).
 * @param {object} [options.projection] - The Mongoose projection object (fields to select/omit).
 * @returns {Promise<object>} An object containing the paginated data and metadata.
 */
exports.getPaginatedData = async (
  Model,
  query,
  { page, limit, sortOptions, projection }
) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.max(1, parseInt(limit, 10) || 20);

  // 1. Get total count
  const total = await Model.countDocuments(query);

  // 2. Calculate pagination metrics
  const totalPages = Math.ceil(total / l);
  const skip = (p - 1) * l;

  // 3. Fetch the paginated data
  const data = await Model.find(query)
    .sort(sortOptions)
    .skip(skip)
    .limit(l)
    .select(projection)
    .lean();

  return {
    data,
    page: p,
    limit: l,
    total,
    totalPages,
  };
};
