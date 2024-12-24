import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount
} from "../globalFunctions"

import Manager from '@manager'
import DB from "../database/DB"
import DateManager from "./dateManager"
import _ from "lodash"

SecurityManager =
  getCalendarEvents: (currentUser) ->
    returnRecords = []
    allEvents = Manager.convertToArray(await DB.getTable(DB.tables.calendarEvents)).flat()
    if !_.isEmpty(allEvents)
      for event in allEvents
        if event.isHoliday and event.visibleToAll
          returnRecords.push(event)
        shareWith = event.shareWith
        if DateManager.dateIsValid(event.startDate)
          if (event.ownerPhone == currentUser?.phone)
            returnRecords.push(event)
          if !_.isEmpty(shareWith) and shareWith.includes(currentUser?.phone)
              returnRecords.push(event)
    return returnRecords

  getExpenses: (currentUser) ->
    returnRecords = []
    allExpenses = Manager.convertToArray(await DB.getTable(DB.tables.expenseTracker)).flat()
    if Manager.isValid(allExpenses,true)
      for expense in allExpenses
        shareWith = expense.shareWith
        if (expense.ownerPhone == currentUser?.phone)
          returnRecords.push(expense)
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser?.phone)
            returnRecords.push(expense)
    return returnRecords
  getSwapRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable(DB.tables.swapRequests)).flat()
    if Manager.isValid(allRequests,true)
      for request in allRequests
        shareWith = request.shareWith
        if (request.ownerPhone == currentUser?.phone)
          returnRecords.push(request)
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser?.phone)
            returnRecords.push(request)
    return returnRecords
  getTransferChangeRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable(DB.tables.transferChangeRequests)).flat()
    if Manager.isValid(allRequests,true)
      for request in allRequests
        shareWith = request.shareWith
        if (request.ownerPhone == currentUser?.phone)
          returnRecords.push(request)
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser?.phone)
            returnRecords.push(request)
    return returnRecords.flat()
  getDocuments: (currentUser) ->
    returnRecords = []
    allDocs = Manager.convertToArray(await DB.getTable(DB.tables.documents)).flat()
    if Manager.isValid(allDocs,true)
      for doc in allDocs
        shareWith = doc.shareWith
        if (doc.phone == currentUser?.phone)
          returnRecords.push(doc)
        if (doc.phone == currentUser?.phone)
          returnRecords.push(doc)
        if Manager.isValid(shareWith, true)
            returnRecords.push(doc)
    return returnRecords.flat()
  getMemories: (currentUser) ->
    returnRecords = []
    allMemories = Manager.convertToArray(await DB.getTable("#{DB.tables.memories}")).flat()
    if Manager.isValid(allMemories,true)
      for memory in allMemories
        shareWith = memory.shareWith
        if (memory.ownerPhone == currentUser?.phone)
          returnRecords.push(memory)
        if Manager.isValid(shareWith, true)
          if shareWith.includes(currentUser?.phone)
            returnRecords.push(memory)
    return returnRecords.flat()
  getArchivedChats: (currentUser) ->
    returnRecords = []
    allArchivedChats = Manager.convertToArray(await DB.getTable("#{DB.tables.archivedChats}")).flat()
    if Manager.isValid(allArchivedChats,true)
      for chatArray in allArchivedChats
        for chat in chatArray
          if (chat.threadOwner == currentUser?.phone)
            returnRecords.push(chat)
    return returnRecords.flat()
  getInputSuggestions: (currentUser) ->
    returnRecords = []
    suggestions = Manager.convertToArray(await DB.getTable(DB.tables.suggestions)).flat()
    if Manager.isValid(suggestions,true)
      for suggestion in suggestions
        if suggestion.ownerPhone == currentUser?.phone
          returnRecords.push(suggestion)
    return returnRecords.flat()
  getChats: (currentUser) ->
    chats = Manager.convertToArray(await DB.getTable("#{DB.tables.chats}")).flat()
    securedChats = []
    # User does not have a chat with root access by phone
    if Manager.isValid(chats, true)
      for chat in chats.flat()
        # Do not push if chat is hidden
        if !Manager.isValid(chat.hideFrom, true) or !chat.hideFrom.includes(currentUser.phone)
            members = chat?.members?.map (x) -> x.phone
            if currentUser?.phone in members
              securedChats.push(chat)
    return securedChats.flat()
  getCoparentChats: (currentUser) ->
    allChats = await DB.getTable('chats')
    activeChats = []
    allChatsFlattened = allChats.flat()
    if Manager.isValid(allChatsFlattened, true)
      for chat in allChatsFlattened
        members = chat.members.map (x) -> x.phone
        if currentUser?.phone in members
          activeChats.push chat
    return activeChats


export default SecurityManager