import React, {useContext, useEffect, useRef} from 'react'
import globalState from '../../context'

const GoogleAutocomplete = ({onChange = (e) => {}, defaultValue, addressType = 'address'}) => {
  const {state, setState} = useContext(globalState)
  const {refreshKey} = state
  const inputRef = useRef(null)

  useEffect(() => {
    if (!window.google || !inputRef.current) return
    if (!(inputRef.current instanceof HTMLInputElement)) {
      console.error('Input ref is not an instance of HTMLInputElement')
      return
    }

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: [addressType],
    })

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      onChange(place.formatted_address)
    })
  }, [addressType])

  return <input ref={inputRef} defaultValue={defaultValue} className="google-autocomplete-input" placeholder="Address" />
}

export default GoogleAutocomplete