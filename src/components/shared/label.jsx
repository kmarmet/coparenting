import React from "react"

export default function Label({labelId = "", classes = "", children, text, required = false, icon = null, isBold = false}) {
    return (
        <div className={`label-wrapper${classes ? ` ${classes}` : ""}`}>
            <label className={`${isBold ? "bold" : ""}`} id={labelId}>
                {icon ? icon : ""}
                {text}
            </label>
            {children}
        </div>
    )
}