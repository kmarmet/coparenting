import Manager from "../../managers/manager"
import DatetimeFormats from "../../constants/datetimeFormats"
import moment from "moment"

class Invitation
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp = moment(options?.timestamp).format(DatetimeFormats.dateForDb) ? moment().format(DatetimeFormats.dateForDb)
    @token = options?.token ? ''
    @recipientPhone = options?.recipientPhone ? ''

    @sender =
      name: options?.sender?.name ? ''
      key: options?.sender?.key ? ''
      email: options?.sender?.email ? ''

    @status = 'sent'

export default Invitation