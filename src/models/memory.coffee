import DateFormats from "../constants/dateFormats"
import moment from "moment"
import Manager from "../managers/manager"

export default class Memory
  constructor: (@id = Manager.getUid(), @creationDate = moment().format(DateFormats.dateForDb), @memoryName = '', @memoryCaptureDate = '',  @notes = '', @shareWith = [], @title = '', @url = '', @ownerPhone = '' ) ->