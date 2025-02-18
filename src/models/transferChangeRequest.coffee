import Manager from "../managers/manager"

export default class TransferChangeRequest
  constructor: (
    @id = Manager.getUid()
    @startDate = ''
    @endDate = ''
    @time = ''
    @ownerKey = ''
    @location = ''
    @directionsLink = ''
    @shareWith = []
    @reason = ''
    @recipientKey = ''
    @responseDueDate = ''
    @preferredTransferLocation = ''
  ) ->