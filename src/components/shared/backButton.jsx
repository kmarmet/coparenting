import React, { useContext, useEffect, useState } from 'react'

function BackButton({ onClick }) {
  return (
    <span onClick={onClick} className="material-icons-outlined back-arrow within-component">
      arrow_back_ios
    </span>
  )
}

export default BackButton
