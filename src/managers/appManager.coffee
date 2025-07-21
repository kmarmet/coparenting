import DB from "../database/DB"
import moment from "moment"
import {child, getDatabase, ref, set} from 'firebase/database'
import DateFormats from "../constants/datetimeFormats"
import DatetimeFormats from "../constants/datetimeFormats"
import DB_UserScoped from "../database/db_userScoped"
import CalendarManager from "./calendarManager"
import Storage from "../database/storage"
import Apis from "../api/apis"
import Manager from "../managers/manager"

export default AppManager =
  OperatingSystems:
    Windows: 'Windows'
    Linux: 'Linux'
    Mac: 'Mac'
    iOS: 'iOS'
    Android: 'Android'
  
  RefreshIfNecessary: ->
# Refresh check
    lastRefresh = localStorage.getItem 'lastAutoRefresh'
    
    if Manager.IsValid lastRefresh
      msSinceLastRefresh = moment(lastRefresh, DatetimeFormats.timestamp).diff() ? 0
      hoursSinceRefresh = Math.abs Math.ceil msSinceLastRefresh / (1000 * 60 * 60)
      
      # If more than 24 hours passed since last refresh → reload
      if hoursSinceRefresh > 24
        localStorage.setItem 'lastAutoRefresh', moment().format(DatetimeFormats.timestamp)
        window.location.reload()
        return false
    
    else
# Last refresh does not exist → set it
      localStorage.setItem 'lastAutoRefresh', moment().format(DatetimeFormats.timestamp)
      
  IncrementLastDigitOfVersion :(version) ->
      # Split into parts
      parts = version.split('.')
      
      # Get the last part as a number
      last = parseInt(parts[parts.length - 1], 10)
      
      # Increment
      last += 1
      
      # Keep the same padding length (optional)
      lastStr = parts[parts.length - 1].replace(/\d+/, String(last).padStart(parts[parts.length - 1].length, '0'))
      
      # Replace the last part
      parts[parts.length - 1] = lastStr
      
      # Join back
      return parts.join('.')

  CheckForUpdate: ->
    currentVersion = await AppManager.GetCurrentAppVersion()
    VERSION_KEY = localStorage.getItem 'version_key'
    
    # If version key does not exist or is outdated → set  it -> return true for caller
    if !Manager.IsValid(VERSION_KEY) or VERSION_KEY != currentVersion
      localStorage.setItem 'version_key', currentVersion
      return true
    # Else return false
    else
      return false
  
  GetCurrentAppVersion: ->
    versions = await DB.getTable "#{DB.tables.appUpdates}"
    return versions[versions?.length - 1]?.currentVersion
  
  UpdateOrRefreshIfNecessary: (currentUser, latestVersion) ->
    AppManager.RefreshIfNecessary()
    
    if Manager.IsValid currentUser
      if not currentUser?.app?.currentVersion or currentUser?.app?.currentVersion != latestVersion
        await DB_UserScoped.updateByPath "#{DB.tables.users}/#{currentUser?.key}/app/currentVersion", latestVersion
        return true
      else
        return false
    else
      return false
  
  GetOS: ->
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
  
  GetIPAddress: ->
    return await Apis.IPify.GetIPAddress()
  
  GetTimezone: ->
    ipAddress = await AppManager.GetIPAddress()
    timezone = ''
    
    try
      timezone = await Apis.ManyApis.GetTimezone ipAddress
    catch error
      console.error error
    
    return timezone
  
  GetLocationDetails: ->
    ipAddress = await Apis.IPify.GetIPAddress()
    
    location =
      city: ''
      timezone: ''
      country: ''
      latitude: ''
      longitude: ''
    
    try
      locationDetails = await Apis.ManyApis.GetLocationDetails ipAddress
      location.ipAddress = ipAddress
      location.city = locationDetails?.city?.name
      location.country = locationDetails?.country?.name
      location.latitude = locationDetails?.city?.latitude
      location.longitude = locationDetails?.city?.longitude
      location.timezone = locationDetails?.city?.timezone
    
    catch error
      console.error error
    
    return location
  
  getQueryStringParams: (queryStringName) ->
    searchParams = new URLSearchParams window.location.search
    
    if Manager.IsValid queryStringName, true
      return searchParams.get queryStringName
    
    return searchParams
  
  SetAppBadge: (count) ->
    if window.navigator.setAppBadge
      return window.navigator.setAppBadge count
  
  clearAppBadge: ->
    if window.navigator.clearAppBadge
      navigator.clearAppBadge()
  
  IsDevMode: ->
    return window.location.hostname == 'localhost'
  
  GetAccountType: (currentUser) ->
    if Manager.IsValid currentUser
      if Manager.IsValid currentUser?.accountType
        if currentUser?.accountType == 'parent'
          return 'parent'
        else
          return 'child'
    'parent'
  
  DeleteExpiredCalendarEvents: (currentUser) ->
    events = await DB.getTable "#{DB.tables.calendarEvents}/#{currentUser?.key}"
    
    if Manager.IsValid events
      events = events.filter (x) -> x?
      events = events.flat()
      
      for event in events
        daysPassed = moment().diff event.startDate, 'days'
        
        if daysPassed >= 30 or moment(event.startDate).year() != moment().year()
          await CalendarManager.deleteEvent currentUser, event.id
  
  setUpdateAvailable: (updateAvailableValue = null) ->
    dbRef = ref getDatabase()
    users = Manager.convertToArray await DB.getTable DB.tables.users
    
    # Set updatedApp=false for all users to trigger update alert
    for user in users
      await DB_UserScoped.updateUserRecord user.phone, "updatedApp", false
    
    lastUpdateObject = await DB.getTable "updateAvailable"
    { updateAvailable } = lastUpdateObject
    timestamp = moment().format DateFormats.timestamp
    
    updateObject =
      lastUpdate: timestamp
      updateAvailable: false
    
    if updateAvailableValue? and updateAvailableValue != undefined
      updateObject.lastUpdate = timestamp
      updateAvailable = false
      set child(dbRef, "updateAvailable"), updateObject
      return false
    
    if !Manager.IsValid(updateAvailable) or updateAvailable == false
      updateObject.updateAvailable = true
      set child(dbRef, "updateAvailable"), updateObject
  
  getLastUpdateObject: ->
    updateObject = await DB.getTable "updateAvailable"
    return updateObject
  
  DeleteExpiredMemories: (currentUser) ->
    memories = await DB.getTable DB.tables.memories
    
    if Manager.IsValid memories
      for memory in memories
        daysPassed = moment().diff memory.creationDate, 'days'
        
        if daysPassed >= 30
          await DB.Delete "#{DB.tables.memories}/#{currentUser?.key}", memory.id
          
          if Manager.IsValid memory?.memoryName
            await Storage.delete Storage.directories.memories, currentUser?.key, memory?.memoryName