import Manager from "./manager"
import DB from "../database/DB"
import moment from "moment"
import { child, getDatabase, ref, set } from 'firebase/database'
import DateFormats from "../constants/datetimeFormats"
import DatetimeFormats from "../constants/datetimeFormats"
import DB_UserScoped from "../database/db_userScoped"
import CalendarManager from "./calendarManager"
import FirebaseStorage from "../database/firebaseStorage"

export default AppManager =
  OperatingSystems: {
    Windows: 'Windows',
    Linux: 'Linux',
    Mac: 'Mac',
    iOS: 'iOS',
    Android: 'Android'
  },

  RefreshIfNecessary: () ->
    # Refresh check
    lastRefresh = localStorage.getItem 'lastAutoRefresh'

    # Last refresh exists
    if Manager.IsValid lastRefresh
      msSinceLastRefresh = moment(lastRefresh, DatetimeFormats.timestamp).diff() ? 0
      hoursSinceRefresh = Math.abs Math.ceil msSinceLastRefresh / (1000 * 60 * 60)

      # If it has been more than 3 hours since the last refresh -> reload the page
      if hoursSinceRefresh > 6
        console.log('true')
        localStorage.setItem 'lastAutoRefresh', moment().format(DatetimeFormats.timestamp)
        window.location.reload()
        return false

    # Last refresh does not exist -> set one
    else
      localStorage.setItem 'lastAutoRefresh', moment().format(DatetimeFormats.timestamp)

  UpdateOrRefreshIfNecessary: (currentUser, latestVersion, delay = 0) ->
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

  getIPAddress: () ->
    ipAddress = ''
    myHeaders = new Headers()

    requestOptions =
      method: "GET"
      headers: myHeaders
      redirect: "follow"

    try
      response = await fetch "https://api.ipify.org", requestOptions
      result = await response.text()
      ipAddress = result
#      console.log result
    catch error
      console.error error
    return ipAddress

  getTimezone: () ->
    ipAddress = await AppManager.getIPAddress()
    timezone = ''
    myHeaders = new Headers()
    myHeaders.append "x-api-key", process.env.REACT_APP_MANY_APIS_API_KEY

    requestOptions =
      method: "GET"
      headers: myHeaders
      redirect: "follow"

    try
      response = await fetch "https://api.manyapis.com/v1-get-ip-detail?ip=#{ipAddress}", requestOptions
      result = await response.json()
      timezone = result?.city?.timezone
#      console.log result?.city?.timezone
    catch error
      console.error error

    return timezone

  getLocationDetails: () ->
    ipAddress = await AppManager.getIPAddress()
    location = {
      city: '',
      timezone: '',
      country: '',
      latitude: '',
      longitude: ''
    }
    myHeaders = new Headers()
    myHeaders.append "x-api-key", process.env.REACT_APP_MANY_APIS_API_KEY

    requestOptions =
      method: "GET"
      headers: myHeaders
      redirect: "follow"

    try
      response = await fetch "https://api.manyapis.com/v1-get-ip-detail?ip=#{ipAddress}", requestOptions
      result = await response.json()
      location.ipAddress = ipAddress
      location.city = result?.city?.name
      location.country = result?.country?.name
      location.latitude = result?.city?.latitude
      location.longitude = result?.city?.longitude
      location.timezone = result?.city?.timezone
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

  setAppBadge: (count) =>
    if window.navigator.setAppBadge
      window.navigator.setAppBadge(count)

  clearAppBadge: =>
    if window.navigator.clearAppBadge
      navigator.clearAppBadge()

  isDevMode: =>
    location.hostname == 'localhost'

  getAccountType: (currentUser) =>
    if Manager.IsValid(currentUser)
      if Manager.IsValid(currentUser?.accountType)
        if currentUser?.accountType == 'parent'
          return 'parent'
        else
          return 'child'
      'parent'

  deleteExpiredCalendarEvents: (currentUser) ->
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

  deleteExpiredMemories: (currentUser) ->
    memories = await DB.getTable(DB.tables.memories)
    if Manager.IsValid(memories)
      for memory in memories
        daysPassed = moment().diff(event.creationDate, 'days')
        if daysPassed >= 30
          await DB.Delete( "#{DB.tables.memories}/#{currentUser?.key}", memory.id)
          if Manager.IsValid(memory?.memoryName)
            await FirebaseStorage.delete(FirebaseStorage.directories.memories, currentUser?.key, memory?.memoryName)