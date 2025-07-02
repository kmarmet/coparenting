class FeedbackEmotionsTracker
  constructor: (options = {}) ->
    @peaceful = options?.peaceful ? 0
    @love = options?.love ? 0
    @neutral = options?.neutral ? 0
    @unhappy = options?.unhappy ? 0

    # OWNER
    @owner =
      key: options?.owner?.key ? ''
      name: options?.owner?.name ? ''

export default FeedbackEmotionsTracker