import Manager from '../managers/manager'
import DB from "../database/DB"
import DateManager from "../managers/dateManager"
import _ from "lodash"
import DB_UserScoped from "../database/db_userScoped"
import DatasetManager from "./datasetManager"

SecurityManager =
  getSharedItems: (currentUser, table) ->
    linkedAccounts = await DB_UserScoped.getLinkedAccounts(currentUser)
    linkedAccountKeys = linkedAccounts.accountKeys
    sharedItems = []

    if Manager.IsValid(currentUser) && Manager.IsValid(linkedAccountKeys)
      for accountKey in linkedAccountKeys
        userAccountItems = await DB.GetTableData("#{table}/#{accountKey}")
        for item in userAccountItems
          if Manager.IsValid(item?.shareWith)
            if item?.shareWith?.includes currentUser?.key
              sharedItems.push(item)

    return DatasetManager.GetValidArray(sharedItems)

  getShareWithItems: (currentUser, table) ->
    sharedItems = []

    #   COPARENT ACCOUNTS
    if Manager.IsValid(currentUser) && Manager.IsValid(currentUser?.coparents)
      for coparent in currentUser?.coparents
        coparentItems = await DB.GetTableData("#{table}/#{coparent?.userKey}")
        for item in coparentItems
          if Manager.IsValid(item?.shareWith)
            if item?.shareWith?.includes currentUser?.key
              sharedItems.push(item)

    #   PARENT ACCOUNTS
    if Manager.IsValid(currentUser) && Manager.IsValid(currentUser?.parents)
      for parent in currentUser?.parents
        parentItems = await DB.GetTableData("#{table}/#{parent?.userKey}")
        for item in parentItems
          if Manager.IsValid(item?.shareWith)
            if item?.shareWith?.includes currentUser?.key
              sharedItems.push(item)

    #   CHILD ACCOUNTS
    if Manager.IsValid(currentUser) && Manager.IsValid(currentUser?.children)
      for child in currentUser?.children
        childItems = await DB.GetTableData("#{table}/#{child?.userKey}")
        for item in childItems
          if Manager.IsValid(item?.shareWith)
            if item?.shareWith?.includes currentUser?.key
              sharedItems.push(item)

    sharedItems = _.flattenDeep(sharedItems)
    return DatasetManager.GetValidArray(sharedItems)

  getCalendarEvents: (currentUser) ->
    users = await DB.GetTableData(DB.tables.users)
    currentUser = users.find (x) -> x.email == currentUser?.email
    returnRecords = []
    allEvents = await DB.GetTableData("#{DB.tables.calendarEvents}/#{currentUser?.key}")
    sharedEvents = await SecurityManager.getShareWithItems(currentUser, DB.tables.calendarEvents)
    if Manager.IsValid(allEvents)
      for event in allEvents
        if DateManager.isValidDate(event.startDate)
          if (event.ownerKey == currentUser?.key)
            returnRecords.push(event)

    if Manager.IsValid(sharedEvents)
      returnRecords = [sharedEvents..., returnRecords...]

    return DatasetManager.GetValidArray(returnRecords)

  GetUserVisitationHolidays: (currentUser) ->
      return [] unless currentUser?.key
      allEvents = []
      sharedEvents = []
      filteredEvents = []
      
      [allEvents, sharedEvents] = await Promise.all [
        DB.GetTableData("#{DB.tables.calendarEvents}/#{currentUser.key}")
        SecurityManager.getShareWithItems currentUser, DB.tables.calendarEvents
      ]
    
      allEvents = [allEvents..., sharedEvents...]
    
      if Manager.IsValid(allEvents)
        filteredEvents = allEvents.filter (event) ->
          Manager.IsValid(event?.startDate) and event?.ownerKey is currentUser.key and event?.isHoliday == true
          
      else
        return []
      
      return DatasetManager.GetValidArray filteredEvents, true

  getExpenses: (currentUser) ->
    returnRecords = []
    allExpenses = DatasetManager.GetValidArray DB.GetTableData("#{DB.tables.expenses}/#{currentUser?.key}")
    sharedExpenses = await SecurityManager.getShareWithItems(currentUser, DB.tables.expenses)

    if Manager.IsValid(allExpenses)
      for expense in allExpenses
        if (expense.ownerKey == currentUser?.key)
          returnRecords.push(expense)
    if Manager.IsValid(sharedExpenses)
      returnRecords = [sharedExpenses..., returnRecords...]
    return DatasetManager.GetValidArray(returnRecords)

  getVisitationChangeRequests: (currentUser) ->
    returnRecords = []
    allRequests = DatasetManager.GetValidArray(await DB.GetTableData("#{DB.tables.visitationRequests}/#{currentUser?.key}"))
    sharedSwaps = await SecurityManager.getShareWithItems(currentUser, DB.tables.visitationRequests)

    if Manager.IsValid(allRequests)
      for request in allRequests
        if (request.ownerKey == currentUser?.key)
          returnRecords.push(request)

    if Manager.IsValid(sharedSwaps)
      returnRecords = [sharedSwaps..., returnRecords...]
    return DatasetManager.GetValidArray(returnRecords)

  getHandoffChangeRequests: (currentUser) ->
    returnRecords = []
    allRequests = DatasetManager.GetValidArray(await DB.GetTableData("#{DB.tables.handoffChangeRequests}/#{currentUser?.key}"))
    sharedTransfers = await SecurityManager.getShareWithItems(currentUser, DB.tables.handoffChangeRequests)

    if Manager.IsValid(allRequests)
      for request in allRequests
        if (request.ownerKey == currentUser?.key)
          returnRecords.push(request)

    if Manager.IsValid(sharedTransfers)
      returnRecords = [sharedTransfers..., returnRecords...]
    return DatasetManager.GetValidArray(returnRecords)

  getDocuments: (currentUser) ->
    returnRecords = []
    allDocs = DatasetManager.GetValidArray(await DB.GetTableData("#{DB.tables.documents}/#{currentUser?.key}"))
    sharedDocs = await SecurityManager.getShareWithItems(currentUser, DB.tables.documents)

    if Manager.IsValid(allDocs)
      for doc in allDocs
        if (doc.ownerKey == currentUser?.key)
          returnRecords.push(doc)

    if Manager.IsValid(sharedDocs)
      returnRecords = [sharedDocs..., returnRecords...]
    return DatasetManager.GetValidArray(returnRecords)

  getMemories: (currentUser) ->
    returnRecords = []
    allMemories = DatasetManager.GetValidArray(await DB.GetTableData("#{DB.tables.memories}/#{currentUser?.key}"))
    sharedMemories = await SecurityManager.getShareWithItems(currentUser, DB.tables.memories)

    if Manager.IsValid(allMemories)
      for memory in allMemories
        if (memory.ownerKey == currentUser?.key)
          returnRecords.push(memory)
    if Manager.IsValid(sharedMemories)
      returnRecords = [sharedMemories..., returnRecords...]

    return DatasetManager.GetValidArray(returnRecords)

  getInputSuggestions: (currentUser) ->
    returnRecords = []
    suggestions = DatasetManager.GetValidArray(await DB.GetTableData(DB.tables.suggestions))
    if Manager.IsValid(suggestions)
      for suggestion in suggestions
        if suggestion.ownerKey == currentUser?.key
          returnRecords.push(suggestion)
    return DatasetManager.GetValidArray(returnRecords)

  getChats: (currentUser) ->
    chats = DatasetManager.GetValidArray(await DB.GetTableData("#{DB.tables.chats}/#{currentUser?.key}"))
    securedChats = []
    return securedChats

  getCoparentChats: (currentUser) ->
    allChats = await DB.GetTableData('chats')
    activeChats = []
    allChatsFlattened = allChats
    if Manager.IsValid(allChatsFlattened)
      for chat in allChatsFlattened
        members = chat.members.map (x) -> x.key
        if currentUser?.key in members
          activeChats.push chat
    return activeChats


export default SecurityManager