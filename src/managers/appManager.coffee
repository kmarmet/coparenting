import Manager from "./manager"
import DB from "../database/DB"
import moment from "moment"
import { child, getDatabase, ref, set } from 'firebase/database'
import DateFormats from "../constants/dateFormats"
import DB_UserScoped from "../database/db_userScoped"
import CalendarManager from "./calendarManager"
import FirebaseStorage from "../database/firebaseStorage"


export default AppManager =
  setAppBadge: (count) =>
    if window.navigator.setAppBadge
      window.navigator.setAppBadge(count)

  clearAppBadge: =>
    if window.navigator.clearAppBadge
      navigator.clearAppBadge()

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

  deleteExpiredCalendarEvents: (currentUser) ->
    events = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser.phone}")
    if Manager.isValid(events)
      events = events.filter (x) -> x?
      events = events.flat()
      for event in events
        daysPassed = moment().diff(event.startDate, 'days')
        if daysPassed >= 30
          await CalendarManager.deleteEvent(currentUser,  event.id)

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

  deleteExpiredMemories: (currentUser) ->
    memories = await DB.getTable(DB.tables.memories)
    if Manager.isValid(memories)
      for memory in memories
        daysPassed = moment().diff(event.creationDate, 'days')
        if daysPassed >= 30
          await DB.delete( "#{DB.tables.memories}/#{currentUser.phone}", memory.id)
          if Manager.isValid(memory?.memoryName)
            await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser.phone, memory?.memoryName)