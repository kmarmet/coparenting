import Manager from '../managers/manager'
import DB from "../database/DB"
import DateManager from "../managers/dateManager"
import _ from "lodash"

SecurityManager =
  getShareWithItems: (currentUser, table) ->
    coparentAndChildEvents  = []

#   PARENT ACCOUNTS
    if Manager.isValid(currentUser) && Manager.isValid(currentUser?.coparents)
      for coparent in currentUser?.coparents
        coparentItems = await DB.getTable("#{table}/#{coparent?.key}")
        for item in coparentItems
          if Manager.isValid(item?.shareWith)
            if item?.shareWith?.includes currentUser?.key
              coparentAndChildEvents.push(item)

#   CHILD ACCOUNTS
    if Manager.isValid(currentUser) && Manager.isValid(currentUser?.parents)
      for parent in currentUser?.parents
        parentItems = await DB.getTable("#{table}/#{parent?.key}")
        for item in parentItems
          if Manager.isValid(item?.shareWith)
            if item?.shareWith?.includes currentUser?.key
              coparentAndChildEvents.push(item)

    coparentAndChildEvents = _.flattenDeep(coparentAndChildEvents)
    coparentAndChildEvents

  getCalendarEvents: (currentUser) ->
    users = await DB.getTable(DB.tables.users)
    currentUser = users.find (x) -> x.email == currentUser?.email
    returnRecords = []
    allEvents = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser?.key}")
    sharedEvents = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
    if Manager.isValid(allEvents)
      for event in allEvents
        if DateManager.isValidDate(event.startDate)
          if (event.ownerKey == currentUser?.key)
            returnRecords.push(event)

    if Manager.isValid(sharedEvents)
      returnRecords = [sharedEvents..., returnRecords...]

    return returnRecords

  getUserVisitationHolidays: (currentUser) ->
    returnRecords = []
    allEvents = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser?.key}")
    sharedEvents = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
    if Manager.isValid(allEvents)
      for event in allEvents
        if DateManager.isValidDate(event.startDate)
          if (event.ownerKey == currentUser?.key)
            returnRecords.push(event)

    if Manager.isValid(sharedEvents)
      returnRecords = [sharedEvents..., returnRecords...]

    return returnRecords

  getExpenses: (currentUser) ->
    returnRecords = []
    allExpenses = Manager.convertToArray(await DB.getTable("#{DB.tables.expenses}/#{currentUser?.key}")).flat()
    sharedExpenses = await SecurityManager.getShareWithItems(currentUser, DB.tables.expenses)

    if Manager.isValid(allExpenses)
      for expense in allExpenses
        if (expense.ownerKey == currentUser?.key)
          returnRecords.push(expense)
    if Manager.isValid(sharedExpenses)
      returnRecords = [sharedExpenses..., returnRecords...]
    return returnRecords

  getSwapRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable("#{DB.tables.swapRequests}/#{currentUser?.key}")).flat()
    sharedSwaps = await SecurityManager.getShareWithItems(currentUser, DB.tables.swapRequests)

    if Manager.isValid(allRequests)
      for request in allRequests
        if (request.ownerKey == currentUser?.key)
          returnRecords.push(request)

    if Manager.isValid(sharedSwaps)
      returnRecords = [sharedSwaps..., returnRecords...]
    return returnRecords

  getTransferChangeRequests: (currentUser) ->
    returnRecords = []
    allRequests = Manager.convertToArray(await DB.getTable("#{DB.tables.transferChangeRequests}/#{currentUser?.key}")).flat()
    sharedTransfers = await SecurityManager.getShareWithItems(currentUser, DB.tables.transferChangeRequests)

    if Manager.isValid(allRequests)
      for request in allRequests
        if (request.ownerKey == currentUser?.key)
          returnRecords.push(request)

    if Manager.isValid(sharedTransfers)
      returnRecords = [sharedTransfers..., returnRecords...]
    return returnRecords.flat()

  getDocuments: (currentUser) ->
    returnRecords = []
    allDocs = Manager.convertToArray(await DB.getTable("#{DB.tables.documents}/#{currentUser?.key}")).flat()
    sharedDocs = await SecurityManager.getShareWithItems(currentUser, DB.tables.documents)

    if Manager.isValid(allDocs)
      for doc in allDocs
        if (doc.ownerKey == currentUser?.key)
          returnRecords.push(doc)

    if Manager.isValid(sharedDocs)
      returnRecords = [sharedDocs..., returnRecords...]
    return returnRecords.flat()

  getMemories: (currentUser) ->
    returnRecords = []
    allMemories = Manager.convertToArray(await DB.getTable("#{DB.tables.memories}/#{currentUser?.key}")).flat()
    sharedMemories = await SecurityManager.getShareWithItems(currentUser, DB.tables.memories)

    if Manager.isValid(allMemories)
      for memory in allMemories
        if (memory.ownerKey == currentUser?.key)
          returnRecords.push(memory)
    if Manager.isValid(sharedMemories)
      returnRecords = [sharedMemories..., returnRecords...]

    return returnRecords.flat()

  getInputSuggestions: (currentUser) ->
    returnRecords = []
    suggestions = Manager.convertToArray(await DB.getTable(DB.tables.suggestions)).flat()
    if Manager.isValid(suggestions)
      for suggestion in suggestions
        if suggestion.ownerKey == currentUser?.key
          returnRecords.push(suggestion)
    return returnRecords.flat()

  getChats: (currentUser) ->
    chats = Manager.convertToArray(await DB.getTable("#{DB.tables.chats}/#{currentUser?.key}")).flat()
    securedChats = []
    # User does not have a chat with root access by phone
    if Manager.isValid(chats)
      for chat in chats
        members = chat?.members?.map (x) -> x.key
        if currentUser?.key in members
          securedChats.push(chat)
    return securedChats.flat()

  getCoparentChats: (currentUser) ->
    allChats = await DB.getTable('chats')
    activeChats = []
    allChatsFlattened = allChats.flat()
    if Manager.isValid(allChatsFlattened)
      for chat in allChatsFlattened
        members = chat.members.map (x) -> x.key
        if currentUser?.key in members
          activeChats.push chat
    return activeChats


export default SecurityManager