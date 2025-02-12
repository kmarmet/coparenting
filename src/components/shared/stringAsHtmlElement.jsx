import React, { useContext, useEffect, useState } from 'react'

export default function StringAsHtmlElement({ text }) {
  return <span className={`string-as-html`} dangerouslySetInnerHTML={{ __html: text }}></span>
}