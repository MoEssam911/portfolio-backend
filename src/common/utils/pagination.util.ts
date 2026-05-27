interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

export function buildPaginationMeta({ page, limit, total }: PaginationParams) {
  const totalPages = Math.ceil(total / limit);

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
