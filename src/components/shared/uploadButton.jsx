// Path: src\components\shared\uploadButton.jsx
import React, {useContext, useRef, useState} from "react"
import {GrAttachment} from "react-icons/gr"
import ButtonThemes from "../../constants/buttonThemes"
import globalState from "../../context"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"
import Button from "./button"
import CardButton from "./cardButton"

function UploadButton({
      containerClass = "",
      getSelectedImages = (e) => {},
      uploadType = "document",
      useAttachmentIcon = false,
      callback = (selectedFile) => {},
      buttonText = "Choose Images",
}) {
      const {state, setState} = useContext(globalState)
      const [fileName, setFileName] = useState("No File Selected")
      const [fileSelected, setFileSelected] = useState(false)

      const fileInputRef = useRef(null)

      const TriggerFileSelection = () => fileInputRef.current?.click()

      const ReturnImages = (event) => {
            const selectedFile = event.target.files?.[0]
            if (!selectedFile) return

            const name = selectedFile.name
            setFileSelected(true)
            setFileName(name)

            // Trigger callback if provided
            if (callback) callback({selectedFile})

            console.log("selectedFile: ", selectedFile)
            setTimeout(() => {
                  getSelectedImages(selectedFile)
            }, 500)
      }

      const GetUploadType = () => {
            if (uploadType?.toLowerCase() === "document") {
                  return "application/pdf,.doc,.docx,application/msword"
            } else {
                  return "image/*"
            }
      }

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
                                    {/* Upload Button */}
                                    <Button text={buttonText} theme={ButtonThemes.white} classes="upload-button" onClick={TriggerFileSelection} />

                                    {/* Hidden File Input */}
                                    <input
                                          ref={fileInputRef}
                                          onChange={(e) => ReturnImages(e)}
                                          multiple
                                          name="file-upload"
                                          type="file"
                                          accept={GetUploadType()}
                                          style={{display: "none"}}
                                    />
                                    {Manager.IsValid(fileName, true) && (
                                          <p className={`${fileSelected ? "file-name active" : "file-name"}`}>
                                                {fileSelected ? "Name: " : ""}
                                                {StringManager.removeFileExtension(StringManager.FormatTitle(fileName.replaceAll("_", " "), true))}
                                          </p>
                                    )}
                              </div>
                        </div>
                  )}
            </>
      )
}

export default UploadButton