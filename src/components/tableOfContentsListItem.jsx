import React, { useState } from 'react'

export default function TableOfContentsListItem({ onClick, text, dataHeader, classes }) {
  const [formattedText, setFormattedText] = useState(text.replaceAll('-', ' ').toUpperCase())
  return (
    <p className={`toc-header ${classes}`} onClick={onClick} data-header-name={dataHeader} dangerouslySetInnerHTML={{ __html: formattedText }}></p>
  )
}