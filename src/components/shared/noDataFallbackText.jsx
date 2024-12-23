import React from 'react'

export default function NoDataFallbackText({ text }) {
  return (
    <div id="instructions-wrapper">
      <p className="instructions center">{text}</p>
    </div>
  )
}