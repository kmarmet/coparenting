import Manager from "../../managers/manager"
import DateFormats from "../../constants/datetimeFormats"
import moment from "moment"

class SwapRequest
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @status = 'pending'
    @startDate =  options?.startDate ? ''
    @shareWith = options?.shareWith ? []
    @endDate =  options?.endDate ? ''
    @creationDate = moment().format(DateFormats.dateForDb)
    @reason = options?.reason ? ''
    @duration = options?.duration ? ''
    @ownerKey = options?.ownerKey ? ''
    @ownerName = options?.ownerName ? ''
    @children = options?.children ? []
    @fromHour = options?.fromHour ? ''
    @toHour = options?.toHour ? ''
    @declineReason = options?.declineReason ? ''
    @responseDate = options?.responseDate ? ''
    @range = options?.range ? []
    @requestedResponseDate = options?.requestedResponseDate ? ''

    # Owner
    @owner =
      name: options?.owner?.name ? ''
      key: options?.owner?.key ? ''

# Recipient
    @recipient =
      key: options?.recipient?.key ''
      name: options?.recipient?.name ''

export default SwapRequest