import Manager from "../managers/manager"

export default class TransferChangeRequest
  constructor: (
    @id = Manager.GetUid()
    @startDate = ''
    @endDate = ''
    @time = ''
    @ownerKey = ''
    @location = ''
    @directionsLink = ''
    @shareWith = []
    @requestReason = ''
    @declineReason = ''
    @recipientKey = ''
    @requestedResponseDate = ''
    @responseDate = ''
    @preferredTransferLocation = ''
  ) ->