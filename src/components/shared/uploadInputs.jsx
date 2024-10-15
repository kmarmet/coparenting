import React, { useEffect, useRef, useState } from 'react'

function UploadInputs({
  upload,
  uploadButtonText = 'Choose File',
  chooseImageClass = '',
  containerClass = '',
  getImages = () => {},
  actualUploadButtonText = 'Upload',
}) {
  return (
    <div id="upload-inputs" className={containerClass}>
      <label htmlFor="upload-input" className={` custom-file-upload w-50 ${chooseImageClass}`}>
        {uploadButtonText}
      </label>
      <button id="file-upload-button">
        <label>Upload</label>
        <input
          onChange={() => getImages(document.getElementById('upload-input').files)}
          id="upload-input"
          name="file-upload"
          type="file"
          multiple
          accept="image/*"
        />
      </button>
      <button
        id="upload-button"
        className="button default w-50 green"
        onClick={() => {
          const files = document.getElementById('upload-input').files
          upload()
          getImages(files)
        }}>
        {actualUploadButtonText} <span className="material-icons-round">upload</span>
      </button>
    </div>
  )
}

export default UploadInputs
