// Path: src\components\shared\uploadButton.jsx
import React, {useContext, useEffect, useState} from "react"
import {GrAttachment} from "react-icons/gr"
import ButtonThemes from "../../constants/buttonThemes"
import globalState from "../../context"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"
import Button from "./button"
import CardButton from "./cardButton"

function UploadButton({
      containerClass = "",
      getImages = (e) => {},
      uploadType = "document",
      useAttachmentIcon = false,
      callback = (selectedFile) => {},
      buttonText = "ChooseBu Images",
}) {
      const {state, setState} = useContext(globalState)
      const [fileName, setFileName] = useState("No File Selected")
      const [fileSelected, setFileSelected] = useState(false)
      const [resetKey, setResetKey] = useState("00")

      const GetUploadType = () => {
            if (uploadType === "document") {
                  return "application/pdf,.doc,.docx,application/msword"
            } else {
                  return "image/*"
            }
      }

      const TriggerFileSelection = () => {
            const uploadInput = document.getElementById("upload-input")
            uploadInput.click()
            setFileName("")
            setFileSelected(false)
      }

      useEffect(() => {
            const uploadInput = document.getElementById("upload-input")
            const fileName = document.querySelector(".file-name")

            // Show selected file name
            // uploadInput.addEventListener("change", () => {
            //       fileName.textContent = uploadInput.files.length > 0 ? uploadInput.files[0].name : "No file chosen"
            // })
            if (Manager.IsValid(uploadInput)) {
                  uploadInput.addEventListener("change", function (event) {
                        const selectedFile = event.currentTarget?.files[0]

                        // Handle the selected file here.
                        if (selectedFile) {
                              setFileSelected(true)
                              const name = selectedFile?.name
                              setFileName(name)
                              fileName.textContent = name
                              if (callback) {
                                    callback(selectedFile)
                              }
                        }
                  })
            }
      }, [])

      return (
            <>
                  {useAttachmentIcon && (
                        <CardButton classes={"attachment-button"} onClick={TriggerFileSelection}>
                              <GrAttachment className={"attachment-icon"} />
                        </CardButton>
                  )}
                  {!useAttachmentIcon && (
                        <div id="upload-inputs" className={containerClass}>
                              <div className="flex">
                                    <Button text={buttonText} theme={ButtonThemes.white} classes={"upload-button"} onClick={TriggerFileSelection} />
                                    <input onChange={getImages} multiple id="upload-input" name="file-upload" type="file" accept={GetUploadType()} />
                                    {Manager.IsValid(fileName, true) && (
                                          <p className={`${fileSelected ? "file-name active" : "file-name"}`}>
                                                {fileSelected ? "Name: " : ""}
                                                {StringManager.removeFileExtension(StringManager.FormatTitle(fileName, true))}
                                          </p>
                                    )}
                              </div>
                        </div>
                  )}
            </>
      )
}

export default UploadButton