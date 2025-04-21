import Manager from "../../managers/manager"
import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"

member = {
  key: '',
  name: '',
  id: ''
}

export default class ChatThread
  constructor: (
    @id = Manager.getUid(),
    @members = [member],
    @creationTimestamp = moment().format(DateFormats.dateForDb),
    @ownerKey = '',
    @isPausedFor = []
  ) ->