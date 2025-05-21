import Manager from "../../managers/manager"
import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"

member = {
  key: '',
  name: '',
  id: ''
}

class ChatThread
  constructor: (
    @id = Manager.GetUid(),
    @members = [member],
    @creationTimestamp = moment().format(DateFormats.dateForDb),
    @ownerKey = '',
    @isPausedFor = []
  ) ->

export default ChatThread