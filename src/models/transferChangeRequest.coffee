import Manager from "../managers/manager"

export default class TransferChangeRequest
  constructor: (
    _id = ''
    _date = ''
    _time = ''
    _phone = ''
    _location = ''
    _createdBy = ''
    _directionsLink = ''
    _shareWith = []
    _reason = ''
    _recipientPhone = ''
    _preferredTransferLocation = ''
  ) ->
    @preferredTransferLocation = _preferredTransferLocation
    @recipientPhone = _recipientPhone
    @id = Manager.getUid()
    @date = _date
    @phone = _phone
    @directionsLink = _directionsLink
    @location = _location
    @time = _time
    @createdBy = _createdBy
    @reason = _reason
    @shareWith = _shareWith


