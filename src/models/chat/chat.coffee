import Manager from "../../managers/manager"
import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"

member =
  key: '',
  name: '',
  id: ''

class Chat
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @members = [member]
    @creationDate = moment().format(DateFormats.dateForDb)
    @ownerKey = options?.ownerKey ? ''
    @isPausedFor =  options?.isPausedFor ? []

export default Chat