import emailjs from '@emailjs/browser'

const EmailManager = {
  supportEmail: 'support@peaceful-coparenting.app',
  sendEmail: (fromName, toEmail, message, emailType) => {
    let templateId = 'template_aewjhvs'
    if (emailType === 'swap-request') {
      templateId = 'template_eso74d8'
    }
    var data = {
      service_id: 'Gmail',
      template_id: templateId,
      user_id: 'khikD1NoIHmBPlckL',
      template_params: {
        from_name: fromName,
        message: message,
        reply_to: toEmail,
      },
    }

    emailjs.send(data.service_id, data.template_id, { ...data.template_params }).then(
      (response) => {
        console.log('SUCCESS!', response.status, response.text)
      },
      (error) => {
        console.log('FAILED...', error)
      }
    )
  },
}

export default EmailManager
