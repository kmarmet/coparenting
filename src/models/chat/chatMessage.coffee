import Manager from "../../managers/manager"

class ChatMessage
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp =  options?.timestamp ? ''
    @message = options?.message ? ''

    @recipient =
      name: options?.recipient?.name ? ''
      key: options?.recipient?.key ? ''

    @sender =
      name: options?.sender?.name ? ''
      key: options?.sender?.key ? ''
      timezone:   options?.sender?.timezone ? ''

export default ChatMessage