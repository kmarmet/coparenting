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
    if Manager.isValid(allEvents,true)
      for event in allEvents
        shareWith = event.shareWith
        if Manager.isValid(event.fromDate) and event.fromDate.length > 0
          if Manager.isValid(shareWith, true)
            if shareWith.includes(currentUser.phone) or event.phone == currentUser.phone
              returnRecords.push(event)
    return returnRecords
  getExpenses: (currentUser) ->
    returnRecords = []
    allExpenses = Manager.convertToArray(await DB.getTable(DB.tables.expenseTracker)).flat()
    if Manager.isValid(allExpenses,true)
      for expense in allExpenses
        shareWith = expense.shareWith
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser.phone) or expense.phone == currentUser.phone
            returnRecords.push(expense)
    return returnRecords
  getSwapRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable(DB.tables.swapRequests)).flat()
    if Manager.isValid(allRequests,true)
      for request in allRequests
        shareWith = request.shareWith
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser.phone) or request.phone == currentUser.phone
            returnRecords.push(request)
      return returnRecords
  getTransferChangeRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable(DB.tables.transferChangeRequests)).flat()
    if Manager.isValid(allRequests,true)
      for request in allRequests
        shareWith = request.shareWith
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser.phone) or request.phone == currentUser.phone
            returnRecords.push(request)
    return returnRecords.flat()
  getDocuments: (currentUser) ->
    returnRecords = []
    allDocs = Manager.convertToArray(await DB.getTable(DB.tables.documents)).flat()
    if Manager.isValid(allDocs,true)
      for doc in allDocs
        shareWith = doc.shareWith
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser.phone) or doc.uploadedBy == currentUser.phone
            returnRecords.push(doc)
    return returnRecords.flat()
  getMemories: (currentUser) ->
    returnRecords = []
    allMemories = Manager.convertToArray(await DB.getTable(DB.tables.memories)).flat()
    if Manager.isValid(allMemories,true)
      for memory in allMemories
        shareWith = memory.shareWith
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser.phone) or memory.createdBy == currentUser.phone
            returnRecords.push(memory)
    return returnRecords.flat()
  getTitleSuggestions: (currentUser) ->
    returnRecords = []
    suggestions = Manager.convertToArray(await DB.getTable(DB.tables.suggestions)).flat()
    if Manager.isValid(suggestions,true)
      for suggestion in suggestions
        if suggestion.ownerPhone == currentUser.phone
          returnRecords.push(suggestion)
    return returnRecords.flat()
  getChats: (currentUser) ->
    returnRecords = []
    chats = Manager.convertToArray(await DB.getTable(DB.tables.chats)).flat()
    if Manager.isValid(chats,true)
      for chat in chats
        for member in chat.members
          if member.phone == currentUser.phone
            returnRecords.push(chat)
    return returnRecords.flat()

export default SecurityManager
