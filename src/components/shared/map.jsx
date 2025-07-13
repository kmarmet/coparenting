import {GoogleMap, MarkerF, useJsApiLoader} from '@react-google-maps/api'
import React, {useCallback, useContext, useEffect, useRef, useState} from 'react'
import {fromAddress, setKey} from 'react-geocode'
import globalState from '../../context.js'
import Manager from '../../managers/manager.js'

export default function Map({locationString}) {
    const {state} = useContext(globalState)
    const {refreshKey} = state
    const [map, setMap] = useState(null)
    const [mapCenter, setMapCenter] = useState(null)
    const mapRef = useRef(null)
    const zoom = 15

    const darkModeStyle = [
        {
            elementType: 'geometry',
            stylers: [{color: '#212121'}],
        },
        {
            elementType: 'labels.icon',
            stylers: [{visibility: 'on'}],
        },
        {
            elementType: 'labels.text.fill',
            stylers: [{color: '#e5e5e5'}],
        },
        {
            elementType: 'labels.text.stroke',
            stylers: [{color: '#212121'}],
        },
        {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{color: '#757575'}],
        },
        {
            featureType: 'poi',
            elementType: 'labels.text.fill',
            stylers: [{color: '#757575'}],
        },
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [{color: '#181818'}],
        },
        {
            featureType: 'road',

            elementType: 'geometry.fill',
            stylers: [{color: '#2c2c2c'}],
        },
        {
            featureType: 'road',
            elementType: 'labels.text.fill',
            stylers: [{color: '#8a8a8a'}],
        },
        {
            featureType: 'transit',
            elementType: 'geometry',
            stylers: [{color: '#2f3948'}],
        },
        {
            featureType: 'water',
            elementType: 'geometry',
            stylers: [{color: '#2e50cc'}],
        },
    ]

    const mapStyle = {
        width: '100%',
        height: '350px',
        borderRadius: '15px',
        overflow: 'auto !important',
    }

    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
    })

    const onLoad = (mapInstance) => {
        retrySetMapCenter()
        setMap(mapInstance)
    }

    const onUnmount = useCallback(() => {
        setMapCenter(null)
        setMap(null)
    }, [])

    const retrySetMapCenter = () => {
        if (typeof locationString === 'string' && locationString.trim().length > 0 && Manager.IsValid(locationString, true)) {
            fromAddress(locationString)
                .then(({results}) => {
                    if (results && results.length > 0) {
                        const location = results[0].geometry.location
                        setMapCenter({
                            lat: location.lat,
                            lng: location.lng,
                        })
                    } else {
                        console.warn('No results from geocoding API')
                    }
                })
                .catch((err) => {
                    console.error('Error fetching location:', err)
                })
        } else {
            console.warn('Invalid location string for geocoding:', locationString)
        }
    }

    const MarkerClicked = (marker) => {
        if (!marker || !marker.latLng) return
        const markerLatLng = marker.latLng.toJSON()
        console.log('Marker clicked:', markerLatLng)
    }

    useEffect(() => {
        if (process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
            setKey(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
        } else {
            console.warn('Missing Google Maps API Key')
        }
    }, [])

    useEffect(() => {
        retrySetMapCenter()
    }, [locationString])

    return isLoaded ? (
        <div key={refreshKey}>
            <GoogleMap
                ref={mapRef}
                mapContainerStyle={mapStyle}
                center={mapCenter}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    disableDefaultUI: false,
                    fullscreenControl: true,
                    zoomControl: true,
                }}>
                {mapCenter && <MarkerF position={{lat: mapCenter.lat, lng: mapCenter.lng}} onClick={MarkerClicked} />}
            </GoogleMap>
        </div>
    ) : (
        <></>
    )
}