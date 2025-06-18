import Manager from "../../managers/manager"
import moment from "moment"
import DateFormats from "../../constants/datetimeFormats"

class Expense
  constructor: (options = {}) ->
    @id = Manager.GetUid()
    @paidStatus = 'unpaid'
    @name = options?.name ? ''
    @imageName = options?.imageName ? ''
    @shareWith = options?.shareWith ? []
    @amount = options?.amount ? 0
    @creationDate = moment().format(DateFormats.dateForDb)
    @children = options?.children ? []
    @dueDate = options?.dueDate ? ''
    @notes = options?.notes ? ''
    @isRecurring = options?.isRecurring ? false
    @recurringFrequency = options?.recurringFrequency ? ''
    @category = options?.category ? ''

    # Owner
    @owner =
      key: options?.owner?.key ? ''
      name: options?.owner?.name ? ''
      phone: options?.owner?.phone ? ''

    # Recipient
    @recipient =
      key: options?.recipient?.key ? ''
      name: options?.recipient?.name ? ''

    # Payer
    @payer =
      phone: options?.payer?.ownerKey ? ''
      key: options?.payer?.key ? ''
      name: options?.payer?.name ? ''

export default Expense