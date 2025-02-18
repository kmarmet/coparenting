import Manager from "../managers/manager"
import DateFormats from "../constants/dateFormats"
import moment from "moment"

export default class SwapRequest
  constructor: (
    @id = Manager.getUid(),
    @startDate = ''
    @shareWith = []
    @endDate = ''
    @dateAdded = moment().format(DateFormats.dateForDb)
    @recipientKey = ''
    @reason = ''
    @duration = ''
    @ownerKey = ''
    @children = ''
    @fromHour = ''
    @toHour = ''
    @status = 'pending'
    @range = []
    @responseDueDate = ''
  ) ->