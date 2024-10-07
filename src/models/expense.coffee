import Manager from "../managers/manager"

export default class Expense
  constructor: (
    @id = '',
    @name = '',
    @imageName = '',
    @shareWith = [],
    @amount = '',
    @createdBy = '',
    @dateAdded = Manager.getCurrentDate(),
    @paidStatus = 'unpaid',
    @children = [],
    @dueDate,
    @phone,
    @notes,
    @recipientName,
    @repeating = false,
    @payer = ''
  ) ->


