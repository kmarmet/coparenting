import StringManager from "./stringManager"

apiKey = process.env.REACT_APP_SMS_API_KEY

export default SmsManager =
  lineBreak: '\r\n'
  signature: "\r\nThank You,\r\nPeaceful coParenting"

  Templates:
    ParentChildVerification: (childName, verificationCode) ->
      "#{StringManager.UppercaseFirstLetterOfAllWords(childName)} is requesting sharing access. #{SmsManager.lineBreak}#{SmsManager.lineBreak}If you would like to grant access, please share this code
   with them: #{verificationCode} #{SmsManager.lineBreak}#{SmsManager.signature}"

    Invitation: (currentUser,userName, recipientPhone) ->
      "Hello #{userName},#{SmsManager.lineBreak}#{SmsManager.lineBreak} You have been invited to join Peaceful coParenting by #{currentUser?.name}. To accept the invite please visit #{SmsManager.lineBreak}https://peaceful-coparenting.app?type=invite&senderKey=#{currentUser?.key} #{SmsManager.lineBreak}  #{SmsManager.lineBreak}#{SmsManager.signature}"

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