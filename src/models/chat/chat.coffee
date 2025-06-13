import Manager from "../../managers/manager"
import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"

class Chat
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @members = options?.members ? []
    @creationDate = moment().format(DateFormats.dateForDb)
    @ownerKey = options?.ownerKey ? ''
    @isPausedFor =  options?.isPausedFor ? []

export default Chat