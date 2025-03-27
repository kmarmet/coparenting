import React from 'react'

const Overlay = ({children, show}) => {
    return (
      <div id="overlay" className={show ? 'active' : ''}>
          {children}
      </div>
    )
}

export default Overlay