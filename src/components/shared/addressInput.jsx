import {Loader} from "@googlemaps/js-api-loader"
import React, {useContext, useEffect, useRef} from "react"
import {CgClose} from "react-icons/cg"
import {FaMapLocationDot} from "react-icons/fa6"
import globalState from "../../context"
import Manager from "../../managers/manager"
import Label from "./label"

const AddressInput = ({onChange = (e) => {}, defaultValue, wrapperClasses = "", labelText = ""}) => {
      const {state} = useContext(globalState)
      const {refreshKey} = state

      // Refs
      const inputRef = useRef(null)
      const autocompleteRef = useRef(null)
      const listenerRef = useRef(null)

      const ClearInput = () => {
            const input = document.querySelector(".google-autocomplete-input")
            if (!input) return
            inputRef.current.value = ""
            input.value = ""
            input.placeholder = "Address"
            inputRef.current.placeholder = "Address"
            onChange("")
      }

      useEffect(() => {
            // if (!window.google || !inputRef.current) return

            // Destroy previous instance & listener
            if (autocompleteRef.current) {
                  window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
            }
            let isMounted = true

            const loader = new Loader({
                  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
                  libraries: ["places"],
            })
            loader.load().then(() => {
                  if (!inputRef.current) return
                  if (!inputRef.current.autocompleteInitialized) {
                        inputRef.current.autocompleteInitialized = true
                        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                              fields: ["name", "formatted_address"],
                        })
                  }

                  listenerRef.current = autocompleteRef.current.addListener("place_changed", () => {
                        const place = autocompleteRef.current.getPlace()
                        if (onChange) {
                              onChange(place.formatted_address)
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
      }, ["establishment", "point_of_interest", "street_address"])

      useEffect(() => {
            if (Manager.IsValid(defaultValue, true)) {
                  inputRef.current.value = defaultValue
            }
      }, [defaultValue])

      return (
            <div className={`google-autocomplete-wrapper${wrapperClasses ? ` ${wrapperClasses}` : ""}`}>
                  {Manager.IsValid(defaultValue) && (
                        <Label text={Manager.IsValid(labelText, true) ? labelText : "Address"} classes={"always-show filled-input-label"} />
                  )}
                  <div className="input-wrapper">
                        <FaMapLocationDot className={"input-icon maps"} />
                        <input
                              ref={inputRef}
                              type={"text"}
                              placeholder={Manager.IsValid(labelText, true) ? labelText : "Address"}
                              defaultValue={defaultValue}
                              className="google-autocomplete-input"
                        />
                        <span className={"clear-input-button"} onClick={ClearInput}>
                              <CgClose />
                        </span>
                  </div>
            </div>
      )
}

export default AddressInput