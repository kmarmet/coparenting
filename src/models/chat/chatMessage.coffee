import Manager from "../../managers/manager"

export default class ConversationMessage
  constructor: (
    @id = Manager.getUid()
    @sender = ''
    @recipient = ''
    @timestamp = ''
    @readState = 'delivered'
    @message = ''
  ) ->