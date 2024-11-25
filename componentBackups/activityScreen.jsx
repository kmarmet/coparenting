import Manager from '../src/managers/manager'
import SecurityManager from '../src/managers/securityManager'

const getMessageCount = async () => {
  const activeChats = Manager.convertToArray(await SecurityManager.getChats(currentUser))
  let unreadMessageCount = 0
  if (Manager.isValid(activeChats, true)) {
    for (let chat of activeChats) {
      const messages = Manager.convertToArray(chat.messages).flat()
      const unreadMessages = messages.filter(
        (x) => formatNameFirstNameOnly(x.recipient) === formatNameFirstNameOnly(currentUser?.name) && x.readState === 'delivered'
      )
      unreadMessageCount = unreadMessages?.length
    }
  }

  return unreadMessageCount
}

const getExpenseCount = async () => {
  const expenses = await SecurityManager.getExpenses(currentUser)
  const unpaidExpenses = expenses.filter((x) => formatNameFirstNameOnly(x.payer.name) === formatNameFirstNameOnly(currentUser?.name))
  return unpaidExpenses.length
}

const getEventCount = async () => {
  const allEvents = await SecurityManager.getCalendarEvents(currentUser)
  const events = allEvents.filter((x) => x.ownerPhone === currentUser?.phone)
  return events.length
}

const getSwapCount = async () => {
  const allRequests = await SecurityManager.getSwapRequests(currentUser)
  const requestsToReturn = allRequests.filter((x) => x.recipientPhone === currentUser?.phone)
  return requestsToReturn.length
}

const getTransferCount = async () => {
  const allRequests = await SecurityManager.getTransferChangeRequests(currentUser)
  const requestsToReturn = allRequests.filter((x) => x.recipientPhone === currentUser?.phone)
  return requestsToReturn.length
}

const getMemoryCount = async () => {
  const allMemories = await SecurityManager.getMemories(currentUser)
  return allMemories.length
}

const getDocumentCount = async () => {
  const allDocs = await SecurityManager.getDocuments(currentUser)
  return allDocs.length
}

const setActivities = async () => {
  //   //TODO CHANGE PHONE
  let newActivitySet = await DB.getTable(`${DB.tables.activitySets}/3307494534`, true)
  const unreadMessageCount = await getMessageCount()

  // Fill from DB
  if (Manager.isValid(newActivitySet, false, true)) {
    setState({ ...state, activitySet: newActivitySet, unreadMessageCount: unreadMessageCount })
  }
  // Create new
  else {
    newActivitySet.expenseCount = await getExpenseCount()
    newActivitySet.unreadMessageCount = unreadMessageCount
    newActivitySet.eventCount = await getEventCount()
    newActivitySet.swapRequestCount = await getSwapCount()
    newActivitySet.transferRequestCount = await getTransferCount()
    newActivitySet.memoryCount = await getMemoryCount()
    newActivitySet.documentCount = await getDocumentCount()
    setState({ ...state, activitySet: newActivitySet, unreadMessageCount: unreadMessageCount })
  }
}