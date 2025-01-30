import React, { useEffect, useState } from 'react'

export default function Label({ labelId = '', classes = '', children, text, required = false, icon = null, isBold = false }) {
  return (
    <div id="label-wrapper" className={classes}>
      <label className={`${isBold ? 'bold' : ''}`} id={labelId}>
        {icon ? icon : ''}
        <span dangerouslySetInnerHTML={{ __html: `${text}${required ? '<span class="asterisk">*</span>' : ''}` }}></span>
      </label>
      {children}
    </div>
  )
}