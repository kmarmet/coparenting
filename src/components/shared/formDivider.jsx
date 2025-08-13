import React from "react"

const FormDivider = ({text, topMargin = 30, wrapperClass = ""}) => {
    return (
        <div
            style={{marginTop: `${topMargin}px`}}
            className={`form-divider${wrapperClass ? ` ${wrapperClass}` : ""}${text === "Required" ? " required" : " optional"}`}>
            <span>
                {text}
                {text === "Required" ? <span className={"asterisk"}>*</span> : ""}
            </span>
        </div>
    )
}

export default FormDivider