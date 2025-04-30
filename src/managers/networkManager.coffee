
NetworkManager = {
  IsOnline: () ->
    return navigator.onLine

  IsValidUrl: (url) ->
    try
      response = await fetch(url, method: 'HEAD')
      return response.ok
    catch error
      return false
}

export default NetworkManager