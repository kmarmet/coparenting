import Manager from "../../managers/manager"
import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"

export default class ChatThread
  constructor: (
    @id = Manager.getUid(),
    @members = [],
    @creationTimestamp = moment().format(DateFormats.dateForDb),
    @ownerKey = '',
    @isPausedFor = []
  ) ->