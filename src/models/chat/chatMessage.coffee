import Manager from "../../managers/manager"

export default class ChatMessage
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