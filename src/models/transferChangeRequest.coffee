import Manager from "../managers/manager"

class TransferChangeRequest
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


export default TransferChangeRequest