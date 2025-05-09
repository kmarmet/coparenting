import Manager from "../managers/manager"
import DateFormats from "../constants/datetimeFormats"
import moment from "moment"

export default class SwapRequest
  constructor: (
    @id = Manager.GetUid(),
    @startDate = ''
    @shareWith = []
    @endDate = ''
    @creationDate = moment().format(DateFormats.dateForDb)
    @recipientKey = ''
    @requestReason = ''
    @duration = ''
    @ownerKey = ''
    @recipientName = ''
    @ownerName = ''
    @children = ''
    @fromHour = ''
    @toHour = ''
    @status = 'pending'
    @declineReason = ''
    @responseDate = ''
    @range = []
    @requestedResponseDate = ''
  ) ->