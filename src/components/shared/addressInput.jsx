import {Loader} from '@googlemaps/js-api-loader'
import React, {useContext, useEffect, useRef, useState} from 'react'
import {FaMapLocationDot} from 'react-icons/fa6'
import globalState from '../../context'
import SelectDropdown from './selectDropdown'

const AddressInput = ({onChange = (e) => {}, defaultValue}) => {
    const {state} = useContext(globalState)
    const {refreshKey} = state

    // State
    const [addressType, setAddressType] = useState('address')

    // Refs
    const inputRef = useRef(null)
    const autocompleteRef = useRef(null)
    const listenerRef = useRef(null)

    const ClearInput = () => {
        const input = document.querySelector('.google-autocomplete-input')
        if (!input) return
        inputRef.current.value = ''
        setAddressType('address')
    }

    useEffect(() => {
        let isMounted = true

        const loader = new Loader({
            apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
            libraries: ['places'],
        })
        loader.load().then(() => {
            if (!inputRef.current) return
            if (!inputRef.current.autocompleteInitialized) {
                inputRef.current.autocompleteInitialized = true
                autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                    fields: ['name', 'formatted_address'],
                    types: [addressType],
                })
            }

            listenerRef.current = autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace()
                if (onChange) {
                    onChange(place?.formatted_address)
                }
            })

            return () => {
                isMounted = false

                // remove event listener
                if (listenerRef.current) {
                    listenerRef.current.remove()
                    listenerRef.current = null
                }

                autocompleteRef.current = null
            }
        })
    }, [])

    return (
        <div className={'google-autocomplete-wrapper'}>
            <div className="input-wrapper">
                <FaMapLocationDot className={'input-icon maps'} />
                <input ref={inputRef} type={'text'} defaultValue={defaultValue} className="google-autocomplete-input" placeholder="Address" />
                {/*<span className={'clear-input-button'} onClick={ClearInput}>*/}
                {/*  CLEAR*/}
                {/*</span>*/}
            </div>

            <SelectDropdown
                placeholder={'Type'}
                options={[
                    {value: 'address', label: 'Address'},
                    {value: 'point_of_interest', label: 'Point of Interest'},
                ]}
                onSelect={(e) => setAddressType(e?.value)}
            />
        </div>
    )
}

export default AddressInput