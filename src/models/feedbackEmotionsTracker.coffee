class FeedbackEmotionsTracker
  constructor: (options = {}) ->
    @peacefulCount = options?.peacefulCount ? 0
    @loveCount = options?.loveCount ? 0
    @neutralCount = options?.neutralCount ? 0
    @unhappyCount  = options?.unhappyCount ? 0

export default FeedbackEmotionsTracker