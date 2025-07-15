import React from 'react'

const FormDivider = ({text, wrapperClass = ''}) => {
    return (
        <div className={`form-divider${wrapperClass ? ` ${wrapperClass}` : ''}`}>
            <span>{text}</span>
        </div>
    )
}

export default FormDivider