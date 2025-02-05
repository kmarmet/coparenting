import { setKey, fromAddress, fromLatLng, RequestType, geocode } from 'react-geocode'

export default LocationManager = {
  getCoordsFromLocation: (location) ->
    setKey(process.env.REACT_GOOGLE_MAPS_API_KEY)
    await fromAddress(location).then ({ results }) ->
        location = results[0].geometry.location
    location

  getAddressFromLatLng: (_lat, _lng) ->
    address = ''
    setKey(process.env.REACT_GOOGLE_MAPS_API_KEY)
    result = await geocode(RequestType.LATLNG, "#{_lat},#{_lng}")
    address = result.results[0].formatted_address
    return address

  getAddress: () ->
    new Promise (resolve, reject) ->
      setKey(process.env.REACT_GOOGLE_MAPS_API_KEY)
      address = ''
      if navigator.geolocation
        navigator.geolocation.getCurrentPosition (position) ->
          pos =
            lat: position.coords.latitude
            lng: position.coords.longitude
          result = await geocode(RequestType.LATLNG, "#{pos.lat},#{pos.lng}")
          address = result.results[0].formatted_address
          resolve(address)
}