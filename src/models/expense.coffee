import Manager from "../managers/manager"
import moment from "moment"
import DateFormats from "../constants/datetimeFormats"

export default class Expense
  constructor: (
    @id = Manager.GetUid(),
    @name = '',
    @imageName = '',
    @shareWith = [],
    @amount = 0,
    @creationDate = moment().format(DateFormats.dateForDb),
    @paidStatus = 'unpaid',
    @children = [],
    @dueDate = '',
    @ownerKey = '',
    @notes = '',
    @recipientName = '',
    @isRecurring = false,
    @recurringFrequency = ''
    @category = '',
    @payer =  {
      phone: '',
      key: '',
      name: ''
    }
  ) ->