import DB from '../../src/database/DB'
import OneSignal from 'react-onesignal'
import Manager from "./manager.js"
import NotificationSubscriber from "../models/notificationSubscriber"
import DB_UserScoped from "../database/db_userScoped"

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
      "Swap Request decision for #{request.startDate} has been APPROVED by #{recipientName}#{NotificationManager.lineBreak}#{NotificationManager.lineBreak}"

    swapRequestRejection: (request, recipientName) ->
      "Swap Request for #{request.startDate} has been REJECTED.#{NotificationManager.lineBreak}#{NotificationManager.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed with the
 request,
  you can communicate with #{recipientName} to come to an agreement on the request."

    transferRequestApproval: (request, recipientName) ->
      "Transfer Change Request decision for #{request.date} has been APPROVED by #{recipientName}#{NotificationManager.lineBreak}#{NotificationManager.lineBreak}"

    transferRequestRejection: (request, recipientName) ->
      "Transfer Change Request for #{request.date} has been REJECTED.#{NotificationManager.lineBreak}#{NotificationManager.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed
 with the
 request, you can communicate with #{recipientName} to come to an agreement on the request."

      #  PRODUCTION
  apiKey: 'os_v2_app_wjb2emrqojh2re4vwfdvavgfgfpm3s3xxaduhlnuiah2weksujvxpesz4fnbclq7b2dch2k3ixixovlaroxcredbec4ghwac4qpcjbi'
  appId: 'b243a232-3072-4fa8-9395-b1475054c531'

# LOCALHOST
#  apiKey: 'os_v2_app_j6desntrnffrplh255adzo5p5dy5bymf5qrexxmauni7ady7m6v5kxspx55zktplqa6un2jfyc6az5yvhaxfkgbtpfjf3siqd2th3ty'
#  appId: '4f864936-7169-4b17-acfa-ef403cbbafe8'
  init: (currentUser) ->
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
    if userSubscribed && subId
      newSubscriber = new NotificationSubscriber()
      setTimeout  ->
        newSubscriber.email = NotificationManager?.currentUser?.email
        newSubscriber.phone = NotificationManager?.currentUser?.phone
        newSubscriber.id = Manager.getUid()
        newSubscriber.subscriptionId = subId
        fetch("https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}/user/identity")
          .then (identity) ->
            userIdentity = await identity.json()
            newSubscriber.oneSignalId = userIdentity?.identity?.onesignal_id
            await DB.add("/#{DB.tables.notificationSubscribers}", newSubscriber)
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

  sendNotification: (title, message, subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey}"
    subIdRecord = await DB.find(DB.tables.notificationSubscribers, ["subscriptionId", subId], true)
    currentUser = await DB.find(DB.tables.users, ["phone", subIdRecord.phone])
    notificationsEnabled = currentUser?.settings?.notificationsEnabled

    if notificationsEnabled
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
        mode: "no-cors"
        redirect: "follow"

      fetch "https://api.onesignal.com/notifications", requestOptions
        .then (response) -> response.text()
        .then (result) ->
          console.log result
          console.log("Sent to #{subId}")
        .catch (error) -> console.error error
    else
      console.log("Notifications disabled for this user")

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

  sendToShareWith: (coparentPhones, currentUser, title, message) ->
    for phone in coparentPhones
      coparent = await DB_UserScoped.getCoparentByPhone(phone, currentUser)
      notificationsEnabled = coparent?.settings?.notificationsEnabled
      if notificationsEnabled
        subId = await NotificationManager.getUserSubId(coparent.phone, "phone")
        await NotificationManager.sendNotification(title, message, subId )