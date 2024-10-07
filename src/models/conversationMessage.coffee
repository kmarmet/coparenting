
import Manager from "../managers/manager"

export default class ConversationMessage
  constructor: (
    _id = ''
    saved = false
    _sender = ''
    _recipient = ''
    _timestamp = ''
    _readState = 'delivered'
    _message = ''
    _notificationSent = false
    _saved = false
  ) ->
    @id = Manager.getUid()
    @saved = _saved
    @message = _message
    @sender = _sender
    @recipient = _recipient
    @timestamp = _timestamp
    @readState = 'delivered'
    @notificationSent = _notificationSent
