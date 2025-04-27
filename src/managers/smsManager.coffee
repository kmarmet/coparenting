import StringManager from "./stringManager"

apiKey = process.env.REACT_APP_SMS_API_KEY

export default SmsManager =
  lineBreak: '\r\n'
  signature: "\r\nThank You,\r\nPeaceful coParenting"
  getNewCalEventTemplate: (title, date, createdBy) =>
    "A new Shared Calendar event has been created by #{createdBy}#{SmsManager.lineBreak}#{SmsManager.lineBreak}Title:#{title}#{SmsManager.lineBreak}Date:#{date}#{SmsManager.lineBreak}#{SmsManager.signature}"
  getNewExpenseTemplate: (title, amount, createdBy) =>
    "A new Expense has been created by #{createdBy}#{SmsManager.lineBreak}#{SmsManager.lineBreak}Expense: #{title}#{SmsManager.lineBreak}Amount: $#{amount}#{SmsManager.lineBreak}#{SmsManager.signature}"
  getNewSwapRequestTemplate: (date, createdBy) =>
    "A new Swap Request has been created by #{createdBy}#{SmsManager.lineBreak}#{SmsManager.lineBreak}Date(s): #{date}#{SmsManager.lineBreak}#{SmsManager.signature}"
  getSwapRequestDecisionTemplate: (date, decision, reason, createdBy) =>
    decisionText = "APPROVED"
    if decision is "rejected"
      decisionText = "REJECTED"
    if reason.length > 0
      "A new Swap Request decision for #{date} has been made by #{createdBy}#{SmsManager.lineBreak}#{SmsManager.lineBreak}Decision: #{decisionText} Reason: #{reason}#{SmsManager.lineBreak}#{SmsManager.signature}"
    else "A new Swap Request decision for #{date} has been made by #{createdBy}#{SmsManager.lineBreak}#{SmsManager.lineBreak}Decision: #{decisionText}#{SmsManager.lineBreak}#{SmsManager.signature}"
  getMarkAsPaidTemplate: (coparent, expenseName) ->
    "An expense has been PAID by #{coparent}#{SmsManager.lineBreak}#{SmsManager.lineBreak}Expense Name: #{expenseName}#{SmsManager.lineBreak}#{SmsManager.signature}"
  getExpenseReminderTemplate: (recipient, expense) ->
    dueDateInfo = if expense.dueDate?.length > 0 then "Due date is: #{expense.dueDate}" else ""
    "This is a reminder to pay the #{expense.name} expense. #{dueDateInfo} #{SmsManager.lineBreak}#{SmsManager.signature}"
  getSwapRequestReminderTemplate: (recipient, request) ->
    "This is a reminder to make a decision for the Swap Request on #{request.startDate} created by #{request.createdBy} on #{request.creationDate}. #{SmsManager.lineBreak}#{SmsManager.signature}"
  getTransferRequestTemplate: (request, createdBy) ->
    "A new Child Transfer Request has been created by #{createdBy} for #{request.date} at #{request.time} #{SmsManager.lineBreak}#{SmsManager.signature}"
    ###*
 * Function to calculate cube of input
 * @param {number} Number to operate on
 * @return {number} Cube of input
 ###
  getParentVerificationTemplate: (childName, verificationCode) ->
    "#{StringManager.uppercaseFirstLetterOfAllWords(childName)} is registering for an profile and requires your permission
   for access. #{SmsManager.lineBreak}#{SmsManager.lineBreak}If you accept, please share this code with them: #{verificationCode} #{SmsManager.lineBreak}#{SmsManager.signature}"
  getRegistrationVerificationTemplate: (userName, verificationCode) ->
    "#{userName} ,please enter this code to continue registration: #{verificationCode} #{SmsManager.lineBreak}#{SmsManager.signature}"
  getPhoneVerificationTemplate: (verificationCode) ->    "Please enter this code for Peaceful coParenting registration #{SmsManager.lineBreak} #{verificationCode}"

  GetRemainingBalance: () ->

    requestOptions =
      method: 'GET'
      redirect: 'follow'

    try
      response = await fetch 'https://peaceful-coparenting.app:5000/messaging/GetTextBalance', requestOptions
      result = await response.text()
      console.log result
      return result;
    catch error
      console.error error

  Send: (phoneNumber, message) ->
      console.log('sent')
      formData = new FormData()
      formData.append 'phone', phoneNumber
      formData.append 'message', message
      formData.append 'key', apiKey

      requestOptions =
        method: 'POST'
        body: formData
        mode: 'no-cors'
        redirect: 'follow'

      try
        response = await fetch 'https://peaceful-coparenting.app:5000/messaging/sendSms', requestOptions
        result = await response.text()
        console.log result
      catch error
        console.error error