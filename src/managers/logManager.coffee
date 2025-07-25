import * as Sentry from '@sentry/react'

LogManager = {
  LogTypes: {
    error: 'Error'
    warning: 'Warning'
    fatal: 'Fatal'
  }
  Log: (message, type = LogManager.LogTypes.error, stackTrace, rawError ) ->
    if not window.location.href.includes( 'localhost' )
      Sentry.captureException("Error: #{message} | Type: #{type} | Stacktrace: #{stackTrace}")
    else
      console.log("Raw Error: #{rawError} | Error Message: #{message} | Type: #{type} | Stacktrace: #{stackTrace}")
}

export default LogManager