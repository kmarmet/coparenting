import Manager from "../../managers/manager"
import DatetimeFormats from "../../constants/datetimeFormats"
import moment from "moment"

class HandoffChangeRequest
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @status = 'pending'
    @startDate = options?.startDate ? ''
    @endDate =  options?.endDate ? ''
    @time =  options?.time ? ''
    @address = options?.address ? ''
    @directionsLink = Manager.GetDirectionsLink(options?.address) ? ''
    @shareWith = options?.shareWith ? []
    @requestReason =  options?.requestReason ? ''
    @declineReason =  options?.declineReason ? ''
    @requestedResponseDate = options?.requestedResponseDate ? ''
    @preferredTransferAddress = options?.preferredTransferAddress ? ''

    # RECIPIENT
    @recipient = {
        name: options?.recipient?.name '',
        key: options?.recipient?.key ''
    }

    # OWNER
    @owner = {
        name: options?.owner?.name '',
        key: options?.owner?.key ''
    }


export default HandoffChangeRequest