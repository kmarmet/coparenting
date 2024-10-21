import Manager from "./manager"
import DB from "../database/DB"
import DateManager from "./dateManager"
import moment from "moment"
import { child, get, getDatabase, push, ref, remove, set, update } from 'firebase/database'


export default AppManager =
  setAppBadge: (count) =>
    if window.navigator.setAppBadge
      window.navigator.setAppBadge(count)
  clearAppBadge: =>
#    window.navigator.clearAppBadge()
  isDevMode: =>
    location.hostname == 'localhost'
  getAccountType: (currentUser) =>
    if Manager.isValid(currentUser)
      if Manager.isValid(currentUser.accountType)
        if currentUser.accountType == 'parent'
          return 'parent'
        else
          return 'child'
      'parent'
  hidePopupCard: () =>
    cardContainer = document.getElementById("popup-card-container")
    if cardContainer
      cardContainer.classList.remove("active")
  applyVersionNumberToUrl: () =>
    versionNumber = Manager.getUid().substring(0,4)
    formattedUpdateUrl = window.location.href.replaceAll(versionNumber, '')
    formattedUpdateUrlWithOneVersion = formattedUpdateUrl.substring(0, formattedUpdateUrl.indexOf("/") + versionNumber)
    history.replaceState(versionNumber, '', formattedUpdateUrlWithOneVersion)
  setHolidays:  () =>
      cal = await DB.getTable(DB.tables.calendarEvents)
      holidays = cal.filter((x) => x.isHoliday is true)
      if holidays.length is 0
        await DateManager.setHolidays()
  deleteExpiredCalendarEvents: ->
    events = await DB.getTable(DB.tables.calendarEvents)
    events = DB.convertKeyObjectToArray(events) unless Array.isArray(events)
    if Manager.isValid(events, true)
      events = events.filter (x) -> x?
      for event in events when Manager.isValid(event)
        daysPassed = DateManager.getDuration('days', moment(), event.fromDate)
        if daysPassed <= -30 and not event.isHoliday
          await DB.delete(DB.tables.calendarEvents, event.id)
          return
  deleteExpiredMemories: ->
    memories = await DB.getTable(DB.tables.memories)
    for memory in memories
      if DateManager.getDuration("days", moment(memory?.creationDate), moment()) > 28
        key = await DB.getNestedSnapshotKey("memories", memory, "id")
        await DB.deleteByPath( "memories/#{key}")