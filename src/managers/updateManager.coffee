import DB from "../database/DB"
import OneSignal from 'react-onesignal'
import Manager from "./manager.js"
import moment from "moment"
import DateFormats from "../constants/datetimeFormats"
import UpdateSubscriber from "../models/updateSubscriber"
import Update from "../models/new/update"
import LogManager from "./logManager"
import Apis from "../api/apis"
import ObjectManager from "./objectManager"

export default UpdateManager =
  currentUser: null
  lineBreak: '\r\n'
# Define message templates
  templates:
# Template for event tomorrow reminder
    eventIsTomorrowReminder: (event) ->
      return "#{event.title} is tomorrow #{if Manager.IsValid(event.startTime) then '@ ' + event.startTime else ''}"

# Template for event in an hour reminder
    eventIsInAnHourReminder: (event) ->
      return "#{event.title} is in 1 hour"

# Template for event in half hour reminder
    eventIsInHalfHourReminder: (event) ->
      return "#{event.title} is in 30 minutes"

# Template for update reminder
    updateReminder: ->
      return 'Visit New Updates in the menu to learn more'

# Template for visitation request decision
    VisitationChangeRequestApproval: (request, recipientName) ->
      return "Visitation Change Request for #{moment(request?.startDate).format(DateFormats.readableMonthAndDay)} has been APPROVED by #{recipientName}#{UpdateManager.lineBreak}#{UpdateManager.lineBreak}"

    VisitationChangeRequestRejection: (request, recipientName) ->
      return "Visitation Change Request for #{moment(request?.startDate).format(DateFormats.readableMonthAndDay)} has been DECLINED.#{UpdateManager.lineBreak}#{UpdateManager.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed with the
 request, please contact #{recipientName} to negotiate a potential agreement"

    handoffChangeRequestApproval: (request, recipientName) ->
      return "Handoffs Change Request for #{moment(request?.startDate).format(DateFormats.readableMonthAndDay)} has been APPROVED by #{recipientName}#{UpdateManager.lineBreak}#{UpdateManager.lineBreak}"

    handoffChangeRequestRejection: (request, recipientName) ->
      return "Handoffs Change Request for #{moment(request?.startDate).format(DateFormats.readableMonthAndDay)} has been DECLINED.#{UpdateManager.lineBreak}#{UpdateManager.lineBreak} Reason: #{request.declineReason}. If you
 would still
 prefer to proceed
 with the
 request, please contact #{recipientName} to negotiate a potential agreement"

#  PRODUCTION
  apiKey: process.env.REACT_APP_ONE_SIGNAL_API_KEY_PROD
  appId: 'b243a232-3072-4fa8-9395-b1475054c531'

# LOCALHOST
#  apiKey: process.env.REACT_APP_ONE_SIGNAL_API_KEY_DEV
#  appId: '4f864936-7169-4b17-acfa-ef403cbbafe8'

  
  init: (currentUser) ->
    try
      UpdateManager.currentUser = currentUser
      window.OneSignalDeferred = window.OneSignalDeferred or []
      OneSignalDeferred.push ->
        OneSignal.init(appId: UpdateManager.appId, allowLocalhostAsSecureOrigin: true).then ->
          OneSignal.User.PushSubscription.addEventListener 'change', UpdateManager.eventListener

    catch error
      LogManager.Log("Error: #{error} | Code File:  | Function:  ")

  eventListener: (event) ->
    userSubscribed = OneSignal.User.PushSubscription.optedIn
    subId = event?.current?.id

    try
      if userSubscribed and subId
        newSubscriber = new UpdateSubscriber()

        setTimeout ->
          newSubscriber.email = UpdateManager?.currentUser?.email
          newSubscriber.key = UpdateManager?.currentUser?.key
          newSubscriber.id = Manager.GetUid()
          newSubscriber.subscriptionId = subId

          fetch("https://api.onesignal.com/apps/#{UpdateManager.appId}/subscriptions/#{subId}/user/identity")
            .then (identity) ->
              userIdentity = await identity.json()
              newSubscriber.oneSignalId = userIdentity?.identity?.onesignal_id
              currentSubscribers = await DB.GetTableData("#{DB.tables.updateSubscribers}")
              
              if Manager.IsValid(currentSubscribers)
                existingSubscriber = currentSubscribers?.find (x) -> x?.email == UpdateManager?.currentUser?.email
                existingSubscriberIndex = DB.GetIndexById(currentSubscribers, existingSubscriber?.id)
                
                # If subscriber does not exist, add
                if not existingSubscriber
                  await DB.Add("#{DB.tables.updateSubscribers}", newSubscriber)
                  
                # If subscriber does exist, update
                else
                  existingSubscriber.subscriptionId = subId
                  if existingSubscriberIndex and existingSubscriberIndex > -1
                    await DB.updateEntireRecord("#{DB.tables.updateSubscribers}/#{existingSubscriberIndex}", existingSubscriber, existingSubscriber.id)
              else
                await DB.Add("#{DB.tables.updateSubscribers}", newSubscriber)
                
        , 500

    catch error
      LogManager.Log("Error: #{error} | Code File:  | Function:  ")

  getUserSubId: (currentUserPhoneOrEmail, phoneOrEmail = "email") ->
    existingRecord = await DB.find(DB.tables.updateSubscribers, [phoneOrEmail, currentUserPhoneOrEmail], true)
    existingRecord?.subscriptionId

  deleteUser: (oneSignalId, subId) ->
    fetch "https://api.onesignal.com/apps/#{UpdateManager.appId}/subscriptions/#{subId}",
      method: 'DELETE'
      headers:
        'accept': 'application/json'

    fetch "https://api.onesignal.com/apps/#{UpdateManager.appId}/users/by/onesignal_id/#{oneSignalId}",
      method: 'DELETE'

  SendUpdate: (title, message, recipientKey, currentUser = null, category = '') ->
    allSubs = await DB.GetTableData("#{DB.tables.updateSubscribers}")
    subIdRecord = allSubs.find (sub) -> sub.key == recipientKey
    #    If user is not subscribed, do not send notification
    if !subIdRecord
      return false
      
    # If notifications for user is muted -> do not send notification
    if currentUser?.mutedUserKeys?.includes recipientKey
      return false

    subId = subIdRecord?.subscriptionId
    
    raw = JSON.stringify(
        {
          app_id: UpdateManager.appId
          contents:
            en: message
          headings:
            en: title
          include_subscription_ids: [subId]
        }
    )
    
    # Add notification to database
    newNotification = new Update()
    newNotification.id = Manager.GetUid()
    newNotification.recipientKey = recipientKey
    newNotification.sharedByName = currentUser?.name
    newNotification.title = title
    newNotification.text = message
    newNotification.category = category
    newNotification.owner =
      key: currentUser?.key
      name: currentUser?.name
      email: currentUser?.email
      phone: currentUser?.phone
      
    newNotification = ObjectManager.CleanObject(newNotification)
    
    await DB.Add "#{DB.tables.updates}/#{recipientKey}", [], newNotification
    await Apis.OneSignal.SendUpdate(subId, raw)

  SendToShareWith: (shareWithKeys, currentUser, title, message, category = '') ->
    if Manager.IsValid(shareWithKeys)
      for key in shareWithKeys
        await UpdateManager.SendUpdate(title, message, key, currentUser, category)
 
  enableNotifications: (subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{UpdateManager.apiKey}"

    url = "https://api.onesignal.com/apps/#{UpdateManager.appId}/subscriptions/#{subId}"

    raw = JSON.stringify({
      "subscription": {
        "type": "Web Push",
        "enabled": true,
        "notification_types": 1
      }
    })

    options = {
      method: 'PATCH'
      headers: myHeaders
      body: raw
    }

    fetch(url, options)
      .then (res) -> res.json()
      .then (json) -> console.log json
      .catch (err) -> console.error err

  disableNotifications: (subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{UpdateManager.apiKey}"

    url = "https://api.onesignal.com/apps/#{UpdateManager.appId}/subscriptions/#{subId}"

    raw = JSON.stringify({
      "subscription": {
        "type": "Web Push",
        "enabled": false,
        "notification_types": -31
      }
    })

    options = {
      method: 'PATCH'
      headers: myHeaders
      body: raw
    }


    fetch(url, options)
      .then (res) -> res.json()
      .then (json) -> console.log json
      .catch (err) -> console.error err