import Manager from "../../managers/manager"

class ChatBookmark
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp = options?.timestamp ? ''
    @ownerKey =  options?.ownerKey ? ''
    @messageId =  options?.messageId ? ''

export default ChatBookmark