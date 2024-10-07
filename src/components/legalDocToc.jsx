import React, { useState, useEffect, useContext } from 'react'

export default function TableOfContentsListItem({ onClick, text }) {
  const [formattedText, setFormattedText] = useState(text.replaceAll('-', ' ').toUpperCase())

  return (
    <p className="toc-header" onClick={onClick}>
      {formattedText.replace(/[0-9]/g, '').replace('.', '')}
    </p>
  )
}
