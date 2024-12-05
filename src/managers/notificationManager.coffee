import DB from '../../src/database/DB'
import OneSignal from 'react-onesignal'
import Manager from "./manager.js"
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
  apiKey: () ->
    if window.location.href.indexOf("localhost") > -1
      return 'os_v2_app_j6desntrnffrplh255adzo5p5dy5bymf5qrexxmauni7ady7m6v5kxspx55zktplqa6un2jfyc6az5yvhaxfkgbtpfjf3siqd2th3ty'
    else
      return 'os_v2_app_wjb2emrqojh2re4vwfdvavgfgfpm3s3xxaduhlnuiah2weksujvxpesz4fnbclq7b2dch2k3ixixovlaroxcredbec4ghwac4qpcjbi'

  init: () ->
    window.OneSignalDeferred = window.OneSignalDeferred or []
    OneSignalDeferred.push ->
      OneSignal.init
        appId: NotificationManager.getAppId()
      .then () ->
        OneSignal.User.PushSubscription.addEventListener 'change', NotificationManager.eventListener

  eventListener:  (event) ->
    userSubscribed = OneSignal.User.PushSubscription.optedIn

    if userSubscribed
      NotificationManager.subscriptionId = event?.current?.id
      localStorage.setItem("subscriptionId", event?.current?.id)
      setTimeout ->
        window.location.reload()
      , 2000

  getUserSubId: (currentUser) ->
    existingRecord = await DB.find(DB.tables.notificationSubscribers, ['email', currentUser.email], true)
    existingRecord.subscriptionId

  sendNotification: (title, message, subId) ->
    myHeaders = new Headers()
    myHeaders.append "Accept", "application/json"
    myHeaders.append "Content-Type", "application/json"
    myHeaders.append "Authorization", "Basic #{NotificationManager.apiKey()}"

    raw = JSON.stringify
      contents:
        en: message
      headings:
        en: title
      target_channel: "push"
      isAnyWeb: true
      enable_frequency_cap: false
      included_segments: ["All"]
      include_aliases:
        aliases: [subId]
      app_id: NotificationManager.getAppId()

    requestOptions =
      method: "POST"
      headers: myHeaders
      body: raw
      redirect: "follow"

    fetch "https://api.onesignal.com/notifications?c=push", requestOptions
      .then (response) -> response.text()
      .then (result) -> console.log result
      .catch (error) -> console.error error

#disableNotifications: (id) ->
#    url = "https://api.onesignal.com/apps/#{NotificationManager.getAppId()}/subscriptions/#{id}"
#    options =
#      method: 'DELETE'
#      headers:
#        accept: 'application/json'

  getAppId: () ->
    if window.location.href.indexOf("localhost") > -1
      appId ='4f864936-7169-4b17-acfa-ef403cbbafe8'
    else
      appId = 'b243a232-3072-4fa8-9395-b1475054c531'
    appId
  sendToShareWith: (coparentPhones, title, message) ->
    for phone in coparentPhones
      subId = await NotificationManager.getUserSubId(phone)
      await NotificationManager.sendNotification(title, message, subId )