
import Manager from "../managers/manager"

export default class ConversationMessage
  constructor: (
    @id = Manager.getUid()
    @bookmarked = false
    @sender = ''
    @recipient = ''
    @timestamp = ''
    @readState = 'delivered'
    @message = ''
    @notificationSent = false
  ) ->
