import Manager from "../../managers/manager"
import moment from "moment-timezone"
import DatetimeFormats from "../../constants/datetimeFormats"

class ChatMessage
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @timestamp =  moment().format(DatetimeFormats.timestamp)
    @message = options?.message ? ''

    @recipient =
      name: options?.recipient?.name ? ''
      key: options?.recipient?.key ? ''

    @sender =
      name: options?.sender?.name ? ''
      key: options?.sender?.key ? ''
      timezone:   options?.sender?.timezone ? ''


export default ChatMessage