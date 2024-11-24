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
    "This is a reminder to make a decision for the Swap Request on #{request.startDate} created by #{request.createdBy} on #{request.dateAdded}. #{SmsManager.lineBreak}#{SmsManager.signature}"
  getTransferRequestTemplate: (request, createdBy) ->
    "A new Child Transfer Request has been created by #{createdBy} for #{request.date} at #{request.time} #{SmsManager.lineBreak}#{SmsManager.signature}"
  getParentVerificationTemplate: (childName, verificationCode) ->
    "#{childName} is registering for an account and requires your permission
 for access. #{SmsManager.lineBreak}#{SmsManager.lineBreak}If you accept, please share this code with them: #{verificationCode} #{SmsManager.lineBreak}#{SmsManager.signature}"
  getRegistrationVerificationTemplate: (userName, verificationCode) ->
    "#{userName} ,please enter this code to continue registration: #{verificationCode} #{SmsManager.lineBreak}#{SmsManager.signature}"
  getPhoneVerificationTemplate: (verificationCode) ->    "Please enter this code for Peaceful coParenting registration #{SmsManager.lineBreak} #{verificationCode}"
  send: (phoneNumber, message) =>
    if location.hostname != 'localhost'
      fetch 'https://textbelt.com/text',
        method: 'post'
        headers: 'Content-Type': 'application/json'
        body: JSON.stringify
          phone: phoneNumber
          message: message
          key: apiKey
        .then (data) ->
          data.json().then (test) ->
            console.log test
          textsRemaining = data['quotaRemaining']
          if textsRemaining <= 5
            SmsManager.send '3307494534', 'Fund SMS account immediately!'
        .then (data) ->
          console.log data
    else
      fetch 'https://textbelt.com/text',
        method: 'post'
        headers: 'Content-Type': 'application/json'
        body: JSON.stringify
          phone: phoneNumber
          message: message
          key: apiKey