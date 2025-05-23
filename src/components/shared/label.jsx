import React from 'react'

export default function Label({labelId = '', classes = '', children, text, required = false, icon = null, isBold = false}) {
  return (
    <div id="label-wrapper" className={`${classes}`}>
      <label className={`${isBold ? 'bold' : ''}`} id={labelId}>
        {icon ? icon : ''}
        {text}
        {required && <span className="asterisk">*</span>}
      </label>
      {children}
    </div>
  )
}