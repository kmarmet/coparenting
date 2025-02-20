// Generated by CoffeeScript 2.7.0
var EmailManager, apiKey;

import emailjs from '@emailjs/browser';

apiKey = process.env.REACT_EMAILJS_API_KEY;

EmailManager = {
  Templates: {
    newActivity: "newActivity",
    featureRequest: 'featureRequest',
    appFeedback: 'appFeedback',
    customerSupport: 'customerSupport',
    emailVerification: 'emailVerification'
  },
  GetConfig: function(message, templateName, fromName) {
    var config;
    config = {
      service_id: 'service_ml9j8d3',
      template_id: templateName,
      user_id: apiKey,
      message: message,
      reply_to: 'support@peaceful-coparenting.app',
      from_name: fromName
    };
    return config;
  },
  SendEmail: function(templateName, message, fromName) {
    var config;
    config = EmailManager.GetConfig();
    config.template_id = templateName;
    config.message = message;
    config.from_name = fromName;
    return emailjs.send(config.service_id, config.template_id, config);
  },
  SendEmailToUser: function(templateName, message, userEmail) {
    var config;
    config = EmailManager.GetConfig();
    config.template_id = templateName;
    config.message = message;
    config.reply_to = userEmail;
    return emailjs.send(config.service_id, config.template_id, config);
  },
  SendFeatureRequest: function(userEmail, message) {
    return EmailManager.SendEmail(EmailManager.Templates.featureRequest, message, userEmail);
  },
  SendAppFeedback: function(userEmail, message) {
    return EmailManager.SendEmail(EmailManager.Templates.appFeedback, message, userEmail);
  },
  SendSupportEmail: function(userEmail, message) {
    return EmailManager.SendEmail(EmailManager.Templates.customerSupport, message, userEmail);
  },
  SendEmailVerification: function(userEmail, message) {
    return EmailManager.SendEmailToUser(EmailManager.Templates.emailVerification, message, userEmail);
  }
};

export default EmailManager;
