
import Manager from "../managers/manager"

export default class ConversationMessage
  constructor: (
    @id = Manager.getUid()
    @saved = false
    @sender = ''
    @recipient = ''
    @timestamp = ''
    @readState = 'delivered'
    @message = ''
    @notificationSent = false
  ) ->
