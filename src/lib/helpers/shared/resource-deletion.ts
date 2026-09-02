export function resolveResourceDeletionQuery<TQuery>(
  query: TQuery,
  shouldMovePageBack: boolean,
  movePageBack: (query: TQuery) => TQuery
): TQuery {
  return shouldMovePageBack ? movePageBack(query) : query
}
