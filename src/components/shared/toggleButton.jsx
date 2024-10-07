import React, { useContext, useEffect, useState } from 'react'

function ToggleButton() {
  const [checked, setChecked] = useState(false)
  return (
    /* From Uiverse.io by Na3ar-17 */
    <div className="container">
      <label className="switch">
        <input type="checkbox" />
        <span className="slider">
          <span className="title">Play</span>
          <span className="ball">
            <span className="icon">
              <span className="material-icons-round">event</span>
              <span className="material-icons-round">date_range</span>
            </span>
          </span>
        </span>
      </label>
    </div>
  )
}

export default ToggleButton
