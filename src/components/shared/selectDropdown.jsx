import React, {useContext, useEffect, useState} from "react"
import {FaMinus, FaPlus} from "react-icons/fa6"
import Select, {components} from "react-select"
import makeAnimated from "react-select/animated"
import globalState from "../../context"
import Manager from "../../managers/manager"
import Label from "./label"

const animatedComponents = makeAnimated()

const DropdownIndicator = (props) => {
    const {menuIsOpen, iconClosed, iconOpen} = props.selectProps
    return (
        <components.DropdownIndicator {...props}>
            {menuIsOpen ? <FaMinus style={{fontSize: "14px", color: "#333"}} /> : <FaPlus style={{fontSize: "14px", color: "#333"}} />}
        </components.DropdownIndicator>
    )
}

export default function SelectDropdown({
    value,
    wrapperClasses,
    labelClasses = "",
    selectMultiple = false,
    isFromViewDropdown = false,
    onSelect = (e) => {},
    placeholder = "",
    options = [],
}) {
    const {state, setState} = useContext(globalState)
    const [hasValue, setHasValue] = useState(false)

    const placeholdersWithoutLabel = ["Select", "Edit", "Details"]

    // STATE
    const [defaultValue, setDefaultValue] = useState(value)

    // REF
    const selectRef = React.useRef(null)

    useEffect(() => {
        if (!isFromViewDropdown && !placeholdersWithoutLabel.includes(placeholder) && Manager.IsValid(value)) {
            setHasValue(true)
        } else {
            setHasValue(false)
        }
    }, [isFromViewDropdown, placeholder, value])

    return (
        <>
            {!isFromViewDropdown && !placeholdersWithoutLabel.includes(placeholder) && Manager.IsValid(value) && (
                <Label
                    text={placeholder.replaceAll("Select", "").replaceAll("a ", "")}
                    classes={`always-show filled-input-label dropdown${labelClasses ? ` ${labelClasses}` : ""}`}
                />
            )}
            <Select
                ref={selectRef}
                components={{animatedComponents, DropdownIndicator}}
                placeholder={placeholder}
                isSearchable={false}
                isClearable={false}
                captureMenuScroll={false}
                blurInputOnSelect={false}
                closeMenuOnSelect={!selectMultiple}
                className={`${wrapperClasses} select-dropdown ${hasValue ? "has-value" : ""}`}
                isMulti={selectMultiple}
                menuShouldScrollIntoView={true}
                value={defaultValue !== value ? value : defaultValue}
                onChange={onSelect}
                options={options}
            />
        </>
    )
}