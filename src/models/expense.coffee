import Manager from "../managers/manager"

export default class Expense
  constructor: (
    @id = '',
    @name = '',
    @imageName = '',
    @shareWith = [],
    @amount = '',
    @dateAdded = Manager.getCurrentDate(),
    @paidStatus = 'unpaid',
    @children = [],
    @dueDate,
    @ownerPhone,
    @notes,
    @recipientName,
    @repeating = false,
    @category = '',
    @payer = ''
  ) ->


