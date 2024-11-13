import Manager from "./manager"
import DB from "../database/DB"
import DateManager from "./dateManager"
import moment from "moment"
import { child, getDatabase, ref, set } from 'firebase/database'
import DateFormats from "../constants/dateFormats"
import DB_UserScoped from "../database/db_userScoped"


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
  deleteExpiredCalendarEvents: ->
    events = await DB.getTable(DB.tables.calendarEvents)
    events = Manager.convertToArray(events) unless Array.isArray(events)
    if Manager.isValid(events, true)
      events = events.filter (x) -> x?
      for event in events when Manager.isValid(event)
        daysPassed = DateManager.getDuration('days', moment(), event.startDate)
        if daysPassed <= -30 and not event.isHoliday
          await DB.delete(DB.tables.calendarEvents, event.id)
          return
  setUpdateAvailable: ( updateAvailableValue = null) ->
    dbRef = ref(getDatabase())
    users = Manager.convertToArray(await DB.getTable(DB.tables.users))
    # Set updatedAp to false for all users to show update alert
    for user in users
      await DB_UserScoped.updateUserRecord(user.phone, "updatedApp", false)
    lastUpdateObject = await DB.getTable("updateAvailable")
    {updateAvailable} =  lastUpdateObject
    timestamp = moment().format(DateFormats.fullDatetime)
    updateObject =
      lastUpdate: timestamp
      updateAvailable: false
    if updateAvailableValue != null and updateAvailableValue != undefined
      updateObject.lastUpdate = timestamp
      updateAvailable= false
      set(child(dbRef, "updateAvailable"), updateObject)
      return false
    if !Manager.isValid(updateAvailable) || updateAvailable == false
      updateObject.updateAvailable = true
      set(child(dbRef, "updateAvailable"), updateObject )
  getLastUpdateObject:  ->
    updateObject = await DB.getTable("updateAvailable")
    return updateObject
  deleteExpiredMemories: ->
    memories = await DB.getTable(DB.tables.memories)
    if Manager.isValid(memories, true)
      for memory in memories
        if DateManager.getDuration("days", moment(memory?.creationDate), moment()) > 28
          key = await DB.getNestedSnapshotKey("memories", memory, "id")
          await DB.deleteByPath( "memories/#{key}")