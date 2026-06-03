function createRequestState() {
  return {
    loading: false,
    error: '',
    errorTitle: '',
    errorDesc: '',
    emptyTitle: '',
    emptyDesc: '',
    partialAvailable: false,
    hasData: false
  }
}

function buildRequestState(options = {}) {
  const {
    loading = false,
    error = '',
    errorTitle = '加载失败',
    errorDesc = '',
    items = [],
    emptyTitle = '暂无内容',
    emptyDesc = '',
    partialAvailable = false
  } = options
  const hasData = Array.isArray(items) && items.length > 0
  return {
    loading,
    error,
    errorTitle,
    errorDesc: errorDesc || error,
    emptyTitle,
    emptyDesc,
    hasError: Boolean(error),
    partialAvailable: Boolean(partialAvailable && hasData),
    hasData,
    isEmpty: !loading && !error && !hasData
  }
}

module.exports = {
  buildRequestState,
  createRequestState
}
