class SlideshowImage
  constructor: (options = {}) ->
    @title = options?.title ? ""
    @notes = options?.notes ? ""
    @url = options?.url ? ""
    @date = options?.date ? ""
    @ownerKey = options?.ownerKey ? ""

export default SlideshowImage