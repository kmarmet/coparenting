import React, { useEffect, useState } from 'react'

export default function Label({ labelId = '', classes = '', children, text, required = false, icon = null, isBold = false }) {
  const [labelText, setLabelText] = useState(text)
  useEffect(() => {
    if (text && required === true) {
      let withAsterisk = text
      withAsterisk = `<span>${text}<span class="asterisk">*</span></span>`
      setLabelText(withAsterisk)
    } else {
      setLabelText(text)
    }
  }, [])
  return (
    <div id="label-wrapper" className={classes}>
      <label className={`${isBold ? 'bold' : ''}`} id={labelId}>
        {icon ? icon : ''}
        <span id="text-wrapper" className="flex" dangerouslySetInnerHTML={{ __html: labelText }}></span>
      </label>
      {children}
    </div>
  )
}