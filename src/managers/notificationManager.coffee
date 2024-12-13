import DB from '../../src/database/DB'
import OneSignal from 'react-onesignal'
import Manager from "./manager.js"
import NotificationSubscriber from "../models/notificationSubscriber"
import DB_UserScoped from "../database/db_userScoped"

export default NotificationManager =
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
  apiKey: 'os_v2_app_wjb2emrqojh2re4vwfdvavgfgfpm3s3xxaduhlnuiah2weksujvxpesz4fnbclq7b2dch2k3ixixovlaroxcredbec4ghwac4qpcjbi'
  appId: 'b243a232-3072-4fa8-9395-b1475054c531'
  init: () ->
    window.OneSignalDeferred = window.OneSignalDeferred or []
    OneSignalDeferred.push ->
      OneSignal.init
        appId: NotificationManager.appId
      .then () ->
        OneSignal.User.PushSubscription.addEventListener 'change', NotificationManager.eventListener

  eventListener:  (event) ->
    userSubscribed = OneSignal.User.PushSubscription.optedIn

    if userSubscribed
        localStorage.setItem("subscriptionId", event?.current?.id)
        setTimeout ->
          window.location.reload()
        , 2000

  getUserSubId: (currentUser) ->
    existingRecord = await DB.find(DB.tables.notificationSubscribers, ['email', currentUser?.email], true)
    existingRecord?.subscriptionId

  addToDatabase: (currentUser, subId) ->
    existingRecord = await DB.find(DB.tables.notificationSubscribers, ['email', currentUser.email], true)

    if subId and not Manager.isValid(existingRecord)
      newSubscriber = new NotificationSubscriber()
      newSubscriber.email = currentUser?.email
      newSubscriber.phone = currentUser?.phone
      newSubscriber.id = Manager.getUid()
      newSubscriber.subscriptionId = subId
#      await NotificationManager.assignExternalId(currentUser)
      await DB.add("/#{DB.tables.notificationSubscribers}", newSubscriber)
      await NotificationManager.sendNotification('Welcome Aboard!', 'You are now subscribed to peaceful communications!', subId)

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
        redirect: "follow"

      fetch "https://api.onesignal.com/notifications", requestOptions
        .then (response) -> response.text()
        .then (result) ->
          console.log result
          console.log("Sent to #{subId}")
        .catch (error) -> console.error error
    else
      console.log("Notifications disabled for this user")

  disableNotifications: (subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey}"

    url = "https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}"
    options =
      method: 'DELETE'
      headers: myHeaders

    fetch(url, options)
      .then (res) -> res.json()
      .then (json) -> console.log json
      .catch (err) -> console.error err


  sendToShareWith: (coparentPhones, currentUser, title, message) ->
    for phone in coparentPhones
      coparent = await DB_UserScoped.getCoparentByPhone(phone, currentUser)
      notificationsEnabled = coparent?.settings?.notificationsEnabled
      if notificationsEnabled
        subId = await NotificationManager.getUserSubId(coparent)
        await NotificationManager.sendNotification(title, message, subId )

  assignExternalId: (currentUser) ->
    myHeaders = new Headers()
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey}"
    myHeaders.append "Content-Type", "application/json"

    raw = JSON.stringify
      identity:
        external_id: currentUser.email
      type: "Web Push"

    requestOptions =
      method: "PATCH"
      headers: myHeaders
      body: raw
      redirect: "follow"

    subId = localStorage.getItem("subscriptionId")

    fetch "https://api.onesignal.com/apps/#{NotificationManager.appId}/subscriptions/#{subId}/user/identity", requestOptions
        .then (response) -> response.text()
        .then (result) ->
          console.log("Assign External ID Result", result)
          localStorage.removeItem('subscriptionId')
        .catch (error) -> console.error error