import React, { useContext, useEffect, useState } from 'react'
import Autocomplete from 'react-google-autocomplete'
import Manager from '../../managers/manager'

export default function AddressInput({ onSelection, defaultValue }) {
  return (
    <Autocomplete
      defaultValue={defaultValue}
      onBlur={(e) => {
        const el = e.target
        const parent = el.parentNode
        const inputWrapper = el.closest('#input-wrapper')
        if (inputWrapper) {
          inputWrapper.classList.remove('active')
        }

        if (el.value.length === 0) {
          parent.querySelector('#label-wrapper').classList.remove('active')
          parent.classList.remove('active')
        }
      }}
      apiKey={process.env.REACT_APP_AUTOCOMPLETE_ADDRESS_API_KEY}
      options={{
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'usa' },
      }}
      placeholder={'Location'}
      onPlaceSelected={(place) => onSelection(place.formatted_address)}
    />
  )
}