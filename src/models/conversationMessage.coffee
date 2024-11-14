import Manager from "../managers/manager"

export default class ConversationMessage
  constructor: (
    @id = Manager.getUid()
    @bookmarks = []
    @sender = ''
    @recipient = ''
    @timestamp = ''
    @readState = 'delivered'
    @message = ''
    @notificationSent = false
    @mutedMembers = [
      target: ''
      ownerPhone: ''
    ]
  ) ->
