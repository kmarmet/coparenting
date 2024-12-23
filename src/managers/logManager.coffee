
LogManager = {
  logTypes: {
    error: 'Error'
    warning: 'Warning'
    fatal: 'Fatal'
  }
  log: (message, type, stackTrace) ->
    requestOptions =
      mode: 'no-cors'
      redirect: 'follow'
    #fetch("https://peaceful-coparenting.app:5000/log?errorMessage=#{message}&messageType=#{type}&stackTrace=#{stackTrace}", requestOptions)
    console.log(message)
    fetch("https://peaceful-coparenting.app:5000/log?errorMessage=#{message}&messageType=#{type}", requestOptions)
}

export default LogManager