import React from 'react'
import Autocomplete from 'react-google-autocomplete'

export default function AddressInput({onSelection = () => {}, defaultValue}) {
  return (
    <Autocomplete
      defaultValue={defaultValue}
      apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
      options={{
        types: ['geocode', 'establishment'],
        componentRestrictions: {country: 'usa'},
      }}
      onChange={(e) => {
        const parent = e.target.parentElement
        const input = e.target
        const value = input.value

        if (value < 1) {
          parent.classList.remove('active', 'show-label')
        } else {
          parent.classList.add('show-label')
        }
      }}
      placeholder={'Location'}
      onPlaceSelected={(place) => onSelection(place.formatted_address)}
    />
  )
}