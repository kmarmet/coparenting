import Manager from "../managers/manager"

export default class TransferChangeRequest
  constructor: (
    @id = Manager.getUid()
    @date = ''
    @time = ''
    @ownerPhone = ''
    @location = ''
    @directionsLink = ''
    @shareWith = []
    @reason = ''
    @recipientPhone = ''
    @responseDueDate = ''
    @preferredTransferLocation = ''
  ) ->