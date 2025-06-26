class FeedbackEmotionsTracker
  constructor: (options = {}) ->
    @peacefulCount = options?.peacefulCount ? 0
    @loveCount = options?.loveCount ? 0
    @neutralCount = options?.neutralCount ? 0
    @unhappyCount  = options?.unhappyCount ? 0

    # OWNER
    @owner =
      key: options?.owner?.key ? ''
      name: options?.owner?.name ? ''

export default FeedbackEmotionsTracker