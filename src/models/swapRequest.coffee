import Manager from "../managers/manager"

export default class SwapRequest
  constructor: (
    _id = ''
    _fromDate = ''
    _shareWith = []
    _createdBy = ''
    _toDate = ''
    _dateAdded = ''
    _recipientPhone = ''
    _reason = ''
    _duration = ''
    _phone = ''
    _children = ''
    _fromHour = ''
    _toHour = ''
    _range = []
  ) ->
    @range = _range
    @children = []
    @id = Manager.getUid()
    @fromDate = _fromDate
    @toDate = _toDate
    @dateAdded = Manager.getCurrentDate()
    @recipientPhone = _recipientPhone
    @shareWith = _shareWith
    @reason = _reason
    @duration = _duration
    @phone = _phone
    @createdBy = _createdBy
    @fromHour = _fromHour
    @toHour = _toHour


