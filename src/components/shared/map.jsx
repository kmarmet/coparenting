// Path: src\components\shared\map.jsx
import {GoogleMap, MarkerF, useJsApiLoader} from '@react-google-maps/api'
import React, {useCallback, useContext, useEffect, useState} from 'react'
import {fromAddress, setKey} from 'react-geocode'
import globalState from '../../context.js'
import Manager from '../../managers/manager.js'

export default function Map({locationString}) {
  const {state, setState} = useContext(globalState)
  const {theme, refreshKey} = state
  const [map, setMap] = useState(null)
  const [mapCenter, setMapCenter] = useState(null)

  let zoom = 15

  const mapStyle = {
    width: '100%',
    height: '350px',
    borderRadius: '15px',
    border: '2px solid #e5e5e5',
  }

  // GoogleMaps loading instructions
  const {isLoaded} = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    version: 'weekly',
  })

  const onLoad = (map) => {
    retrySetMapCenter()
    setMap(map)
  }

  const onUnmount = useCallback(function callback(map) {
    setMapCenter(null)
    setMap(null)
  }, [])

  const retrySetMapCenter = () => {
    if (Manager.IsValid(locationString, true)) {
      fromAddress(locationString).then(({results}) => {
        const location = results[0].geometry.location
        setMapCenter({
          lat: location.lat,
          lng: location.lng,
        })
      })
    }
  }

  useEffect(() => {
    retrySetMapCenter()
  }, [locationString])

  // Function executed when a marker is clicked
  const markerClicked = (marker) => {
    console.log('map value on marker click: ')
    console.log(map)
    // This stores the marker coordinates
    // in which we will use for the center of your circle
    const markerLatLng = marker.latLng.toJSON()
    console.log(markerLatLng)
    // this is for you to see that the circles array is updated.
  }

  useEffect(() => {
    setKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
  }, [])

  return isLoaded ? (
    <div key={refreshKey}>
      <GoogleMap
        // options={{ mapTypeControl: false, streetViewControl: false }}
        mapContainerStyle={mapStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}>
        {Manager.IsValid(mapCenter) && <MarkerF position={{lat: mapCenter.lat, lng: mapCenter.lng}} onClick={markerClicked}></MarkerF>}
      </GoogleMap>
    </div>
  ) : (
    <></>
  )
}