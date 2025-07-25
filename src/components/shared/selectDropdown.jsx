import React, {useContext, useState} from "react"
import Select from "react-select"
import makeAnimated from "react-select/animated"
import globalState from "../../context"
import Manager from "../../managers/manager"
import Label from "./label"

const animatedComponents = makeAnimated()

export default function SelectDropdown({
      value,
      wrapperClasses,
      selectMultiple = false,
      isFromViewDropdown = false,
      onSelect = (e) => {},
      placeholder = "",
      options = [],
}) {
      const {state, setState} = useContext(globalState)
      const {menuIsOpen, showScreenActions, showCreationMenu, showOverlay} = state

      const placheholdersWithoutLabel = ["Select", "Edit", "Details"]

      // STATE
      const [defaultValue, setDefaultValue] = useState(value)

      // REF
      const selectRef = React.useRef(null)

      return (
            <>
                  {!isFromViewDropdown && !placheholdersWithoutLabel.includes(placeholder) && Manager.IsValid(value) && (
                        <Label text={placeholder.replaceAll("Select", "").replaceAll("a ", "")} classes={"always-show filled-input-label"} />
                  )}
                  <Select
                        ref={selectRef}
                        components={animatedComponents}
                        placeholder={placeholder}
                        isSearchable={false}
                        isClearable={false}
                        captureMenuScroll={false}
                        blurInputOnSelect={false}
                        closeMenuOnSelect={!selectMultiple}
                        className={`${wrapperClasses} select-dropdown`}
                        isMulti={selectMultiple}
                        menuShouldScrollIntoView={true}
                        value={defaultValue !== value ? value : defaultValue}
                        onChange={onSelect}
                        options={options}
                  />
            </>
      )
}