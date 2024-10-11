import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  uniqueArray,
  getFileExtension
} from "../globalFunctions"

import Manager from '@manager'
import DB from "../database/DB"

SecurityManager =
  getCalendarEvents: (currentUser) ->
    returnRecords = []
    allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents)).flat()
    for event in allEvents
      shareWith = event.shareWith
      if Manager.isValid(shareWith, true)
        if shareWith.includes(currentUser.phone) or event.phone == currentUser.phone
          returnRecords.push(event)
    return returnRecords
  getExpenses: (currentUser) ->
    returnRecords = []
    allExpenses = Manager.convertToArray(await DB.getTable(DB.tables.expenseTracker)).flat()
    for expense in allExpenses
      shareWith = expense.shareWith
      if Manager.isValid(shareWith, true)
        if shareWith.includes(currentUser.phone) or expense.phone == currentUser.phone
          returnRecords.push(expense)
    return returnRecords
  getSwapRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable(DB.tables.swapRequests)).flat()
    for request in allRequests
      shareWith = request.shareWith
      if Manager.isValid(shareWith, true)
        if shareWith.includes(currentUser.phone) or request.phone == currentUser.phone
          returnRecords.push(request)
    return returnRecords

export default SecurityManager
