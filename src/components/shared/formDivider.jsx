import React from "react"

const FormDivider = ({text, wrapperClass = ""}) => {
    return (
        <div className={`form-divider${wrapperClass ? ` ${wrapperClass}` : ""}${text === "Required" ? " required" : " optional"}`}>
            <span>
                {text}
                {text === "Required" ? <span className={"asterisk"}>*</span> : ""}
            </span>
        </div>
    )
}

export default FormDivider