import React, { useEffect, useRef, useState } from 'react'

function UploadInputs({ upload, uploadButtonText = 'Choose File', className = '', getImages, actualUploadButtonText = 'Upload' }) {
  const [showUploadButton, setShowUploadButton] = useState(false)

  return (
    <div id="upload-inputs">
      <label onClick={() => setShowUploadButton(true)} htmlFor="upload-input" className={`button default custom-file-upload w-50 ${className}`}>
        {uploadButtonText}
      </label>
      <input
        onChange={() => {
          getImages(document.getElementById('upload-input').files)
        }}
        id="upload-input"
        name="file-upload"
        type="file"
        multiple
        accept="image/*"
      />
      {showUploadButton && (
        <button id="upload-button" className="button default w-50 green" onClick={upload}>
          {actualUploadButtonText} <span className="material-icons-round">upload</span>
        </button>
      )}
    </div>
  )
}

export default UploadInputs
