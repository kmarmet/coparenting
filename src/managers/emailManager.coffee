import emailjs from '@emailjs/browser'
apiKey = process.env.REACT_EMAILJS_API_KEY

EmailManager =
  Templates:
    newActivity: "newActivity"
    featureRequest: 'featureRequest'
    appFeedback: 'appFeedback'
    customerSupport: 'customerSupport'
  GetConfig: (message, templateName, fromName) ->
    config =
      service_id: 'service_ml9j8d3'
      template_id: templateName
      user_id: apiKey
      message: message
      reply_to: 'support@peaceful-coparenting.app'
      from_name: fromName
    return config
  SendEmail: ( templateName, message, fromName) ->
    config = EmailManager.GetConfig()
    config.template_id = templateName
    config.message = message
    config.from_name = fromName
    emailjs.send(config.service_id, config.template_id, config)
  SendFeatureRequest: (userEmail, message) ->
    EmailManager.SendEmail(EmailManager.Templates.featureRequest, message, userEmail)
  SendAppFeedback: (userEmail,message) ->
    EmailManager.SendEmail( EmailManager.Templates.appFeedback, message, userEmail)
  SendSupportEmail: (userEmail, message) ->
    EmailManager.SendEmail( EmailManager.Templates.customerSupport, message, userEmail)

export default EmailManager