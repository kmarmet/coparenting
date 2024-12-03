# Import required modules
import NotificationManager from "../managers/notificationManager"
import Manager from "../managers/manager"
# Define PushAlertApi object
PushAlertApi =
# Define line break constant
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
      "Swap Request decision for #{request.startDate} has been APPROVED by #{recipientName}#{PushAlertApi.lineBreak}#{PushAlertApi.lineBreak}"

    swapRequestRejection: (request, recipientName) ->
      "Swap Request for #{request.startDate} has been REJECTED.#{PushAlertApi.lineBreak}#{PushAlertApi.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed with the request,
  you can communicate with #{recipientName} to come to an agreement on the request."

    transferRequestApproval: (request, recipientName) ->
      "Transfer Change Request decision for #{request.date} has been APPROVED by #{recipientName}#{PushAlertApi.lineBreak}#{PushAlertApi.lineBreak}"

    transferRequestRejection: (request, recipientName) ->
      "Transfer Change Request for #{request.date} has been REJECTED.#{PushAlertApi.lineBreak}#{PushAlertApi.lineBreak} Reason: #{request.reason}. If you would still prefer to proceed with the
 request, you can communicate with #{recipientName} to come to an agreement on the request."

# Determine API URL based on environment
  apiUrl: ->
    if location.hostname is 'localhost'
      'http://localhost:3002'
    else
      'https://www.peaceful-coparenting.com'

# Send message to all users
  sendToAll: (title, message) ->
    fetch 'https://peaceful-coparenting.app:5000/messaging/sendToAll',
      method: 'POST'
      mode: 'no-cors'
      body: JSON.stringify
        title: title
        message: message

# Manually Trigger Subscribe Alert
  showSubscribeAlert: () ->
    window.pushalertbyiw ?= []
    window.pushalertbyiw.push ['onReady', onPAReady]
    onPAReady = ->
      PushAlertCo.forceSubscribe
#    onPAReady = ->
#      PushAlertCo.triggerMe true

  # Subscribe a user to push notifications
  subscribeUser: (userPhone) ->
    myHeaders = new Headers()
    myHeaders.append 'Content-Type', 'application/json'
    myHeaders.append 'Authorization', '461dafa18ed1684310b34ae8d00f746e'
    myHeaders.append 'Access-Control-Allow-Origin', '*'

    urlToUse = 'https://api.pushalert.co/rest/v1/segment/38837/add'

    requestOptions =
      method: 'POST'
      mode: 'no-cors'
      headers: myHeaders
      body: JSON.stringify
        subscibers: [userPhone]
      redirect: 'follow'

    fetch(urlToUse, requestOptions)
      .then (result) -> console.log result
      .catch (error) -> console.error error

# Send a message to a specific user
  sendMessage: (title, message, subId) ->
    myHeaders = new Headers()
    myHeaders.append 'Access-Control-Allow-Headers', 'Content-Type, x-requested-with'
    myHeaders.append 'Access-Control-Allow-Origin', '*'
    subIdToUse = subId
    urlToUse = 'https://peaceful-coparenting.app:5000/messaging/sendMessage'

    urlencoded = new URLSearchParams()
    urlencoded.append 'title', title
    urlencoded.append 'url', 'https://www.peaceful-coparenting.com'
    urlencoded.append 'message', message
    urlencoded.append 'subscriber', subIdToUse

    requestOptions =
      method: 'POST'
      mode: 'no-cors'
      headers: myHeaders
      body: urlencoded
      redirect: 'follow'
    fetch(urlToUse, requestOptions)
      .then (result) -> console.log "Sent to: #{subIdToUse}"
      .catch (error) -> console.error error

# Get subscriber ID for a user
  getSubId: (userPhone) ->
    await NotificationManager.getUserSubId(userPhone)

# Export PushAlertApi object
export default PushAlertApi