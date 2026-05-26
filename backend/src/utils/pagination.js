function getPagination(query) {
  const page = Math.max(parseInt(query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || '20', 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function paginatedResponse({ data, total, page, limit }) {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
}

module.exports = { getPagination, paginatedResponse };

