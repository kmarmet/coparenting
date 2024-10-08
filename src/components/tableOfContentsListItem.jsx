import React, { useState, useEffect, useContext } from 'react'

export default function TableOfContentsListItem({ onClick, text, dataHeader }) {
  const [formattedText, setFormattedText] = useState(text.replaceAll('-', ' ').toUpperCase())
  return (
    <p className="toc-header" onClick={onClick} data-header-name={dataHeader}>
      {formattedText.replace(/[0-9]/g, '').replace('.', '').replaceAll('•', '')}
    </p>
  )
}
