import * as Sentry from '@sentry/react'

LogManager = {
  LogTypes: {
    error: 'Error'
    warning: 'Warning'
    fatal: 'Fatal'
  }
  Log: (message, type = LogManager.LogTypes.error, stackTrace) ->
    if not !window.location.href.includes( 'localhost' )
      Sentry.captureException("Error: #{message} | Type: #{type} | Stacktrace: #{stackTrace}")
}

export default LogManager