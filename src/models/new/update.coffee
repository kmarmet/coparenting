import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"
import Manager from "../../managers/manager"

class Update
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp = moment().format(DateFormats.timestamp)
    @category = options?.category ? ''
    @recipientKey = options?.recipientKey ? ''
    @ownerKey =  options?.ownerKey ? ''
    @title =  options?.title ? ''

export default Update