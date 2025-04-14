import Manager from "../../managers/manager"

export default class ChatMessage
  constructor: (
    @id = Manager.getUid()
    @sender = ''
    @recipient = ''
    @timestamp = ''
    @message = ''
    @recipientKey = ''
    @senderKey = ''
    @senderTimezone = ''
  ) ->