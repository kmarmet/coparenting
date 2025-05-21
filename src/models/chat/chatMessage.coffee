import Manager from "../../managers/manager"

class ChatMessage
  constructor: (
    @id = Manager.GetUid()
    @sender = ''
    @recipient = ''
    @timestamp = ''
    @message = ''
    @recipientKey = ''
    @senderKey = ''
    @senderTimezone = ''
  ) ->

export default ChatMessage