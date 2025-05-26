import Manager from "../../managers/manager"
import DatetimeFormats from "../../constants/datetimeFormats"
import moment from "moment"

class TransferChangeRequest
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @creationDate = moment().format(DatetimeFormats.dateForDb)
    @status = 'pending'
    @startDate = options?.startDate ? ''
    @endDate =  options?.endDate ? ''
    @time =  options?.time ? ''
    @ownerKey = options?.ownerKey ? ''
    @address = options?.address ? ''
    @directionsLink = Manager.GetDirectionsLink(options?.address) ? ''
    @shareWith = options?.shareWith ? []
    @requestReason =  options?.requestReason ? ''
    @declineReason =  options?.declineReason ? ''
    @recipientKey =  options?.recipientKey ? ''
    @recipient = {
        name: options?.recipient?.name '',
        key: options?.recipient?.key ''
    }
    @requestedResponseDate = options?.requestedResponseDate ? ''
    @preferredTransferAddress = options?.preferredTransferAddress ? ''


export default TransferChangeRequest