import React, { useState, useEffect, useContext } from "react";
import screenNames from "../../constants/screenNames";
import globalState from "../../context";
import util from "../../util";
import FirebaseStorage from "../../firebaseStorage";

export default function UploadAgreement() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;

  const upload = async () => {
    const imgs = document.querySelector("#upload-input").files;
    await FirebaseStorage.uploadMultiple(`${FirebaseStorage.directories.agreements}/`, currentUser.id, imgs).then(() => {
      setState({ ...state, currentScreenTitle: "View Agreement", currentScreen: screenNames.agreement });
    });
  };

  useEffect(() => {
    setState({ ...state, currentScreenTitle: "Upload Agreement" });
  }, []);

  return (
    <div id="upload-agreement-container" className="page-container">
      <p>Upload all images of your dissolution/divorce agreement.</p>
      <p>Files uploaded MUST be images (.png, .jpg, .jpeg, etc.). </p>
      <p>If you have documents such as .doc or .docx, please visit the link below to convert them (free) to images.</p>
      <a href="https://convertio.co/doc-jpg/" target="_blank">
        Convert pdf/doc to image
      </a>
      <br />
      <p>Once you have converted and downloaded the images to your device, you can upload them here. Then you will be able to view your agreement, with a full table of contents</p>
      <div className="form">
        <input id="upload-input" type="file" multiple accept="image/*" />
        <button onClick={upload}>Upload</button>
      </div>
    </div>
  );
}
