import React from 'react'

function Note({ message, elClass }) {
  return (
    <div>
      <p className={`note ${elClass && elClass.length > 0 ? elClass : ''}`} dangerouslySetInnerHTML={{ __html: message }}></p>
    </div>
  )
}

export default Note
