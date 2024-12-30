import Manager from "../managers/manager"
import moment from "moment"
import DateFormats from "../constants/dateFormats"

export default class Expense
  constructor: (
    @id = Manager.getUid(),
    @name = '',
    @imageName = '',
    @shareWith = [],
    @amount = 0,
    @dateAdded = moment().format(DateFormats.dateForDb),
    @paidStatus = 'unpaid',
    @children = [],
    @dueDate = '',
    @ownerPhone = '',
    @notes = '',
    @recipientName = '',
    @repeating = false,
    @category = '',
    @payer =  {
      phone: '',
      name: ''
    }
  ) ->