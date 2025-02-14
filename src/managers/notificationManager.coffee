import DB from '../../src/database/DB'
import OneSignal from 'react-onesignal'
import Manager from "./manager.js"
import NotificationSubscriber from "../models/notificationSubscriber"
import DB_UserScoped from "../database/db_userScoped"
import ActivitySet from "../models/activity"

export default NotificationManager =
  currentUser: null
  lineBreak: '\r\n'
# Define message templates
  templates:
# Template for event tomorrow reminder
    eventIsTomorrowReminder: (event) ->
      "#{event.title} is tomorrow #{if Manager.isValid(event.fromTime) then '@ ' + event.fromTime else ''}"

# Template for event in an hour reminder
    eventIsInAnHourReminder: (event) ->
      "#{event.title} is in 1 hour"

# Template for event in half hour reminder
    eventIsInHalfHourReminder: (event) ->
      "#{event.title} is in 30 minutes"

# Template for update reminder
    updateReminder: ->
      'Visit New Updates in the menu to learn more'

# Template for swap request decision
    swapRequestApproval: (request, recipientName) ->
      "Swap Request for #{request.startDate} has been APPROVED by #{recipientName}#{NotificationManager.lineBreak}#{NotificationManager.lineBreak}"

    swapRequestRejection: (request, recipientName) ->
      "Swap Request for #{request.startDate} has been REJECTED.#{NotificationManager.lineBreak}#{NotificationManager.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed with the
 request,
  you can communicate with #{recipientName} to come to an agreement on the request."

    transferRequestApproval: (request, recipientName) ->
      "Transfer Change Request for #{request.date} has been APPROVED by #{recipientName}#{NotificationManager.lineBreak}#{NotificationManager.lineBreak}"

    transferRequestRejection: (request, recipientName) ->
      "Transfer Change Request for #{request.date} has been REJECTED.#{NotificationManager.lineBreak}#{NotificationManager.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed
 with the
 request, you can communicate with #{recipientName} to come to an agreement on the request."

#  PRODUCTION
  apiKey: 'os_v2_app_wjb2emrqojh2re4vwfdvavgfgfpm3s3xxaduhlnuiah2weksujvxpesz4fnbclq7b2dch2k3ixixovlaroxcredbec4ghwac4qpcjbi'
  appId: 'b243a232-3072-4fa8-9395-b1475054c531'

# LOCALHOST
  # apiKey: 'os_v2_app_j6desntrnffrplh255adzo5p5dy5bymf5qrexxmauni7ady7m6v5kxspx55zktplqa6un2jfyc6az5yvhaxfkgbtpfjf3siqd2th3ty'
  # appId: '4f864936-7169-4b17-acfa-ef403cbbafe8'
  init: (currentUser) ->
    console.log(NotificationManager.appId)
    NotificationManager.currentUser = currentUser
    window.OneSignalDeferred = window.OneSignalDeferred or []
    OneSignalDeferred.push ->
      OneSignal.init
        appId: NotificationManager.appId
      .then () ->
        OneSignal.User.PushSubscription.addEventListener 'change', NotificationManager.eventListener

  eventListener:  (event) ->
    userSubscribed = OneSignal.User.PushSubscription.optedIn
    subId =  event?.current?.id
    console.log(OneSignal.User)
    console.log(subId)
    console.log(userSubscribed)
    if userSubscribed && subId
      newSubscriber = new NotificationSubscriber()
      setTimeout  ->
        console.log(NotificationManager?.currentUser)
        newSubscriber.email = NotificationManager?.currentUser?.email
        newSubscriber.phone = NotificationManager?.currentUser?.phone
        newSubscriber.id = Manager.getUid()
        newSubscriber.subscriptionId = subId
        fetch("https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}/user/identity")
          .then (identity) ->
            userIdentity = await identity.json()
            newSubscriber.oneSignalId = userIdentity?.identity?.onesignal_id
            existingSubscriber = await DB.find(DB.tables.notificationSubscribers, ["phone", NotificationManager?.currentUser?.phone], true)

            # If user already exists -> replace record
            if Manager.isValid(existingSubscriber)
              deleteKey = await DB.getSnapshotKey("#{DB.tables.notificationSubscribers}", existingSubscriber, "id")
              await DB.deleteByPath("#{DB.tables.notificationSubscribers}/#{deleteKey}")
            await DB.add("/#{DB.tables.notificationSubscribers}", newSubscriber)
          .catch (error) -> 
            console.error error
      , 500

  getUserSubId: (currentUserPhoneOrEmail, phoneOrEmail = "email") ->
    existingRecord = await DB.find(DB.tables.notificationSubscribers, [phoneOrEmail, currentUserPhoneOrEmail], true)
    existingRecord?.subscriptionId

  deleteUser: (oneSignalId, subId) ->
    fetch "https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}",
      method: 'DELETE'
      headers:
        'accept': 'application/json'

    fetch "https://api.onesignal.com/apps/#{NotificationManager.appId}/users/by/onesignal_id/#{oneSignalId}",
      method: 'DELETE'

  viewUser: (subId) ->
    userIdentity = ''
    fetch("https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}/user/identity")
      .then (identity) ->
        userIdentity =await identity.json()
      .then (result) ->
      .catch (error) -> console.error error
    userIdentity

  sendNotification: (title, message, recipientPhone, currentUser = null,  category = '') ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey}"
    subIdRecord = await DB.find(DB.tables.notificationSubscribers, ["phone", recipientPhone], true)
    subId = subIdRecord?.subscriptionId

    raw = JSON.stringify
      contents:
        en: message
      headings:
        en: title
      target_channel: "push"
      isAnyWeb: true
      include_subscription_ids: [subId]
      app_id: NotificationManager.appId

    requestOptions =
      method: "POST"
      headers: myHeaders
      body: raw
      redirect: "follow"

    # Add activity to database
    newActivity = new ActivitySet()
    newActivity.id = Manager.getUid()
    newActivity.recipientPhone = recipientPhone
    newActivity.sharedByPhone = currentUser?.phone
    newActivity.sharedByName = currentUser?.name
    newActivity.title = title
    newActivity.text = message
    newActivity.category = category

    DB.add "#{DB.tables.activities}/#{recipientPhone}", newActivity

    # Do not send notification in dev
    if !window.location.href.includes("localhost")
      fetch "https://api.onesignal.com/notifications", requestOptions
        .then (response) -> response.text()
        .then (result) ->
          console.log result
          console.log("Sent to #{subId}")
        .catch (error) -> console.error error

  enableNotifications: (subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey}"

    url = "https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}"

    raw = JSON.stringify({
      "subscription": {
        "type": "Web Push",
        "enabled": true,
        "notification_types": 1
      }
    });


    options =
      method: 'PATCH'
      headers: myHeaders
      body: raw

    fetch(url, options)
      .then (res) -> res.json()
      .then (json) -> console.log json
      .catch (err) -> console.error err

  disableNotifications: (subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey}"

    url = "https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}"

    raw = JSON.stringify({
      "subscription": {
        "type": "Web Push",
        "enabled": false,
        "notification_types": -31
      }
    });

    options =
      method: 'PATCH'
      headers: myHeaders
      body: raw

    fetch(url, options)
      .then (res) -> res.json()
      .then (json) -> console.log json
      .catch (err) -> console.error err

  sendToShareWith: (recipientPhones, currentUser, title, message, category = '') ->
    if Manager.isValid(recipientPhones)
      for phone in recipientPhones
        coparent = await DB_UserScoped.getCoparentByPhone(phone, currentUser)
        await NotificationManager.sendNotification(title, message, coparent?.phone, currentUser, category )