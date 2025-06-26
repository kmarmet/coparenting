import Manager from "./manager"
import DB from "../database/DB"
import moment from "moment"
import {child, getDatabase, ref, set} from 'firebase/database'
import DateFormats from "../constants/datetimeFormats"
import DatetimeFormats from "../constants/datetimeFormats"
import DB_UserScoped from "../database/db_userScoped"
import CalendarManager from "./calendarManager"
import Storage from "../database/storage"
import Apis from "../api/apis"

export default AppManager =
  OperatingSystems:
    Windows: 'Windows'
    Linux: 'Linux'
    Mac: 'Mac'
    iOS: 'iOS'
    Android: 'Android'

  RefreshIfNecessary: () ->
    # Refresh check
    lastRefresh = localStorage.getItem 'lastAutoRefresh'

    # Last refresh exists
    if Manager.IsValid lastRefresh
      msSinceLastRefresh = moment(lastRefresh, DatetimeFormats.timestamp).diff() ? 0
      hoursSinceRefresh = Math.abs Math.ceil msSinceLastRefresh / (1000 * 60 * 60)

      # If it has been more than 24 hours since the last refresh -> reload the page
      if hoursSinceRefresh > 24
        localStorage.setItem 'lastAutoRefresh', moment().format(DatetimeFormats.timestamp)
        window.location.reload()
        return false

    # Last refresh does not exist -> set one
    else
      localStorage.setItem 'lastAutoRefresh', moment().format(DatetimeFormats.timestamp)

  GetCurrentAppVersion: () ->
    versions = await  DB.getTable("#{DB.tables.appUpdates}")
    return versions[versions?.length - 1]?.currentVersion

  UpdateOrRefreshIfNecessary: (currentUser, latestVersion) ->
    AppManager.RefreshIfNecessary();
    if Manager.IsValid currentUser
      if not currentUser?.app?.currentVersion or currentUser?.app?.currentVersion != latestVersion
        await DB_UserScoped.updateByPath("#{DB.tables.users}/#{currentUser?.key}/app/currentVersion", latestVersion)
        return true
      else
        return false
    else
      return false

  GetOS: () ->
    userAgent = window.navigator.userAgent
    platform = window.navigator.platform
    macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
    windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE']
    iosPlatforms = ['iPhone', 'iPad', 'iPod']
    os = null

    if macosPlatforms.indexOf(platform) isnt -1
      os = AppManager.OperatingSystems.Mac
    else if iosPlatforms.indexOf(platform) isnt -1
      os = AppManager.OperatingSystems.iOS
    else if windowsPlatforms.indexOf(platform) isnt -1
      os = AppManager.OperatingSystems.Windows
    else if /Android/.test(userAgent)
      os = AppManager.OperatingSystems.Android
    else if not os and /Linux/.test(platform)
      os = AppManager.OperatingSystems.Linux

    return os

  GetIPAddress: () ->
    return await Apis.IPify.GetIPAddress()

  GetTimezone: () ->
    ipAddress = await AppManager.GetIPAddress()
    timezone = ''

    try
      timezone = await Apis.ManyApis.GetTimezone(ipAddress)
#      console.log result?.city?.timezone
    catch error
      console.error error

    return timezone

  GetLocationDetails: () ->
    ipAddress = await Apis.IPify.GetIPAddress()
    location = {
      city: '',
      timezone: '',
      country: '',
      latitude: '',
      longitude: ''
    }

    try
      locationDetails = await Apis.ManyApis.GetLocationDetails(ipAddress)
      location.ipAddress = ipAddress
      location.city = locationDetails?.city?.name
      location.country = locationDetails?.country?.name
      location.latitude = locationDetails?.city?.latitude
      location.longitude = locationDetails?.city?.longitude
      location.timezone = locationDetails?.city?.timezone
#      console.log(location)
#      console.log result
    catch error
      console.error error

    return location

  getQueryStringParams: (queryStringName) ->
    searchParams = new URLSearchParams(window.location.search);

    if Manager.IsValid(queryStringName, true)
      return searchParams.get(queryStringName)

    return searchParams

  SetAppBadge: (count) ->
    if window.navigator.setAppBadge
      window.navigator.setAppBadge(count)

  clearAppBadge: ->
    if window.navigator.clearAppBadge
      navigator.clearAppBadge()

  IsDevMode: ->
    location.hostname == 'localhost'

  GetAccountType: (currentUser) ->
    if Manager.IsValid(currentUser)
      if Manager.IsValid(currentUser?.accountType)
        if currentUser?.accountType == 'parent'
          return 'parent'
        else
          return 'child'
      'parent'

  DeleteExpiredCalendarEvents: (currentUser) ->
    events = await DB.getTable("#{DB.tables.calendarEvents}/#{currentUser?.key}")
    if Manager.IsValid(events)
      events = events.filter (x) -> x?
      events = events.flat()
      for event in events
        daysPassed = moment().diff(event.startDate, 'days')
        if daysPassed >= 30 || moment(event.startDate).year() != moment().year()
          await CalendarManager.deleteEvent(currentUser,  event.id)

  setUpdateAvailable: ( updateAvailableValue = null) ->
    dbRef = ref(getDatabase())
    users = Manager.convertToArray(await DB.getTable(DB.tables.users))
    # Set updatedAp to false for all users to show update alert
    for user in users
      await DB_UserScoped.updateUserRecord(user.phone, "updatedApp", false)
    lastUpdateObject = await DB.getTable("updateAvailable")
    {updateAvailable} =  lastUpdateObject
    timestamp = moment().format(DateFormats.timestamp)
    updateObject =
      lastUpdate: timestamp
      updateAvailable: false
    if updateAvailableValue != null and updateAvailableValue != undefined
      updateObject.lastUpdate = timestamp
      updateAvailable= false
      set(child(dbRef, "updateAvailable"), updateObject)
      return false
    if !Manager.IsValid(updateAvailable) || updateAvailable == false
      updateObject.updateAvailable = true
      set(child(dbRef, "updateAvailable"), updateObject )

  getLastUpdateObject:  ->
    updateObject = await DB.getTable("updateAvailable")
    return updateObject

  DeleteExpiredMemories: (currentUser) ->
    memories = await DB.getTable(DB.tables.memories)
    if Manager.IsValid(memories)
      for memory in memories
        daysPassed = moment().diff(event.creationDate, 'days')
        if daysPassed >= 30
          await DB.Delete( "#{DB.tables.memories}/#{currentUser?.key}", memory.id)
          if Manager.IsValid(memory?.memoryName)
            await Storage.delete(Storage.directories.memories, currentUser?.key, memory?.memoryName)