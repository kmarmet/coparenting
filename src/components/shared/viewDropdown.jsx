import React, {useEffect} from "react"
import ViewTypes from "../../constants/views"
import Manager from "../../managers/manager"
import SelectDropdown from "./selectDropdown"
import Spacer from "./spacer"

export default function ViewDropdown({
    selectedView,
    views = ViewTypes.DetailsEdit.All,
    dropdownPlaceholder = "",
    onSelect = (e) => {},
    wrapperClasses = "",
    show = false,
    hasSpacer = false,
}) {
    const AddFilledInputLabel = (e) => {
        const activeForm = document.querySelector(`.form-wrapper.active`)

        setTimeout(() => {
            const allInputFields = activeForm?.querySelectorAll(".input-field")

            if (Manager.IsValid(allInputFields)) {
                allInputFields.forEach((inputField) => {
                    const input = inputField.querySelector("input")
                    if (input && input.value.trim() !== "") {
                        const labelAndIcon = inputField.querySelector(".label-and-icon")
                        if (labelAndIcon) {
                            labelAndIcon.classList.add("filled")
                        }
                    }
                })
            }
        }, 500)
    }
    useEffect(() => {
        AddFilledInputLabel()
        onSelect(selectedView)
    }, [selectedView])

    return (
        <div className={`views-dropdown${wrapperClasses ? ` ${wrapperClasses}` : ""}`}>
            {hasSpacer && <Spacer height={10} />}
            <SelectDropdown
                options={views}
                wrapperClasses={`${wrapperClasses}`}
                value={selectedView}
                isFromViewDropdown
                selectMultiple={false}
                className={wrapperClasses}
                placeholder={dropdownPlaceholder}
                onSelect={(e) => onSelect(e)}
                show={show}
            />
        </div>
    )
}