import Manager from "../managers/manager"
import DatetimeFormats from "../constants/datetimeFormats"
import moment from "moment"

class Invitation
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp = moment(options?.timestamp).format(DatetimeFormats.dateForDb) ? moment().format(DatetimeFormats.dateForDb)
    @senderKey = options?.senderKey
    @recipientPhone = options?.recipientPhone ? ''
    @senderName = options?.senderName ? ''
    @senderEmail = options?.senderEmail ? ''
    @status = 'sent'

export default Invitation