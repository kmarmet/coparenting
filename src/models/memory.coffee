import DateFormats from "../constants/datetimeFormats"
import moment from "moment"
import Manager from "../managers/manager"

class Memory
  constructor: (@id = Manager.GetUid(), @creationDate = moment().format(DateFormats.dateForDb), @memoryName = '', @memoryCaptureDate = '',  @notes = '', @shareWith = [], @title = '', @url = '', @ownerKey = '' ) ->

export default Memory