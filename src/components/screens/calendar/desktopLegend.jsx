import React, { useState } from 'react'
import Label from '../../shared/label.jsx'
import { HiOutlineColorSwatch } from 'react-icons/hi'

export default function DesktopLegend() {
  const [showLegend, setShowLegend] = useState(false)
  return (
    <div id="desktop-legend-wrapper">
      <div className="flex" id="legend-row" onClick={() => setShowLegend(!showLegend)}>
        <HiOutlineColorSwatch />
        <Label text={'Legend'} />
      </div>
      <div id="legend-content" className={showLegend ? 'active' : ''}>
        <p className="flex currentUser">
          <span className="in-legend currentUser"></span> Your Event
        </p>
        <p className="flex coparent">
          <span className="coparent in-legend"></span> Shared Event
        </p>
        <p className="flex standard">
          <span className="in-legend standard"></span> Holiday
        </p>
        <p className="flex financial">Financial Event</p>
      </div>
    </div>
  )
}