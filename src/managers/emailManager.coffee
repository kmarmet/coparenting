import emailjs from '@emailjs/browser'

apiKey = process.env.REACT_EMAILJS_API_KEY

EmailManager =
  Templates:
    newActivity: "newActivity"
    featureRequest: 'featureRequest'
    appFeedback: 'appFeedback'
    customerSupport: 'customerSupport'
    emailVerification: 'emailVerification'
    coparentInvitation: 'coparent-invitation'
    parentInvitation: 'parent-invitation'
    shareDocument: 'shareDocument'
    
  GetConfig: (message, templateName, fromName) ->
    config =
      service_id: 'service_ml9j8d3'
      template_id: templateName
      user_id: apiKey
      message: message
      reply_to: 'support@peaceful-coparenting.app'
      from_name: fromName
    return config
    
  SendEmail: ( templateName, message, userEmail) ->
    config = EmailManager.GetConfig()
    config.template_id = templateName
    config.message = message
    config.from_name = userEmail
    emailjs.send(config.service_id, config.template_id, config)
    
  SendDocumentSharingEmail: ({ templateName, message, userEmail}) ->
    config = EmailManager.GetConfig()
    config.template_id = EmailManager.Templates.coparentInvitation
    config.message = message
    config.from_name = config.reply_to
    url = "https://peaceful-coparenting.app/"
    emailjs.send(config.service_id, config.template_id, {url: url, message: message, reply_to: userEmail,from_name: userEmail,to_email: userEmail, from_name: config.reply_to}).then (response)  ->
      console.log('SUCCESS!', response.status, response.text)
      
  SendEmailToUser: ( templateName, message, userEmail, fromName) ->
    config = EmailManager.GetConfig()
    config.template_id = "coParent-invitation"
    config.message = message
    config.from_name = fromName
    emailjs.send('default_service', templateName,  {to_email: userEmail, from_name: fromName}).then (response) ->
      console.log('SUCCESS!', response.status, response.text)
      
  SendFeatureRequest: (userEmail, message) ->
    EmailManager.SendEmail(EmailManager.Templates.featureRequest, message, userEmail)
    
  SendAppFeedback: (userEmail,message) ->
    EmailManager.SendEmail( EmailManager.Templates.appFeedback, message, userEmail)
    
  SendSupportEmail: (userEmail, message) ->
    EmailManager.SendEmail( EmailManager.Templates.customerSupport, message, userEmail)
    
  SendEmailVerification: (userEmail, message) ->
    EmailManager.SendEmailToUser( EmailManager.Templates.emailVerification, message, userEmail)

export default EmailManager