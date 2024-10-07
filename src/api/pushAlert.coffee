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
    swapRequestDecision: (request, decision) ->
      "A new Swap Request decision for #{request.fromDate} has been made by #{request.createdBy}#{PushAlertApi.lineBreak}#{PushAlertApi.lineBreak}Decision: #{decision}"

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

    if location.hostname isnt "localhost"
      fetch(urlToUse, requestOptions)
        .then (result) -> console.log "Sent to: #{subIdToUse}"
        .catch (error) -> console.error error
    else
      fetch(urlToUse, requestOptions)
        .then (result) -> console.log "Sent to: #{subIdToUse}"
        .catch (error) -> console.error error

# Get subscriber ID for a user
  getSubId: (userPhone) ->
    await NotificationManager.getUserSubId(userPhone)

# Export PushAlertApi object
export default PushAlertApi

