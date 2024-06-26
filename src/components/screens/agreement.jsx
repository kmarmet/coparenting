import React, { useState, useEffect, useContext } from "react";
import screenNames from "../../constants/screenNames";
import globalState from "../../context";
import util from "../../util";
import FirebaseStorage from "../../firebaseStorage";
import Modal from "../shared/modal";
import AgreementUtil from "../../agreementUtil";
import TableOfContentsListItem from "../agreementToc";

export default function Agreement() {
  const { state, setState } = useContext(globalState);
  const { currentUser } = state;
  const [tocHeaders, setTocHeaders] = useState([]);
  const [showTextContainer, setShowTextContainer] = useState(false);
  const [convertedImageCount, setConvertedImageCount] = useState(0);
  const [imageCount, setImageCount] = useState(0);

  const scrollToHeader = (header) => {
    const el = document.querySelector(`[data-header-name='${header.replaceAll(" ", "-").replaceAll(",", "-")}']`);
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const toggleJumpToSection = () => {
    const toc = document.querySelector("#table-of-contents");
    const overlay = document.querySelector(".overlay");
    if (toc.classList.contains("open")) {
      toc.classList.remove("open");
      overlay.classList.remove("active");
    } else {
      toc.classList.add("open");
      overlay.classList.add("active");
    }
  };

  const dadJokes = () => {
    const response = fetch("https://api.api-ninjas.com/v1/dadjokes", {
      method: "GET",
      headers: { "X-Api-Key": "5off26fJvnvnRreBISpwNA==XcVQrnBtGjuZ2gPJ" },
      contentType: "application/json",
    });
    response.then((jokeResponse) => {
      jokeResponse.json().then((dadJoke) => {
        document.querySelector(".modal .dad-joke").textContent = dadJoke[0].joke;
      });
    });
  };

  const getImages = async () => {
    // Get Firebase images
    FirebaseStorage.getImages(FirebaseStorage.directories.agreements, currentUser.id)
      .then(async (imgs) => {
        if (imgs.length === 0) {
          setState({ ...state, currentScreenTitle: "Upload Agreement", currentScreen: screenNames.uploadAgreement });
        } else {
          setImageCount(imgs.length);

          Promise.all(imgs).then(async (allImagePaths) => {
            let pageCounter = 0;
            for (let path of allImagePaths) {
              await AgreementUtil.textToImageAndAppend(path, document.querySelector("#text-container"));
              pageCounter++;
              setConvertedImageCount(pageCounter);

              // Dont extracting text
              if (pageCounter >= allImagePaths.length) {
                setShowTextContainer(true);

                // Filter TOC
                const spanHeaders = document.querySelectorAll(".header");
                let newHeaderArray = [];
                spanHeaders.forEach((header) => {
                  const text = header.textContent.replaceAll(" ", "-");
                  if (newHeaderArray.indexOf(text) === -1) {
                    newHeaderArray.push(text);
                  }
                });
                setTocHeaders(newHeaderArray);
              }
            }
          });
        }
      })
      .catch((error) => {
        if (error.toString().indexOf("does not exist") > -1) {
          setState({ ...state, currentScreenTitle: "Upload Agreement", currentScreen: screenNames.uploadAgreement });
        }
      });
  };

  useEffect(() => {
    if (currentUser) {
      // Show dad jokes while loading
      dadJokes();
      const jokeInterval = setInterval(() => {
        dadJokes();
      }, [7000]);

      // Stop jokes and show text container
      setTimeout(() => {
        clearInterval(jokeInterval);
      }, [102000]);

      // Get all images
      getImages();
    }
    setState({ ...state, currentScreenTitle: "View Agreement" });
  }, []);

  return (
    <div id="agreement-container" className="page-container">
      <div className="overlay"></div>
      <div className="form">
        <Modal elClass={!showTextContainer ? "show" : ""} hasClose={false}>
          <>
            <p>Retrieving the agreement...</p>
            <p>This can take up to 2 minutes</p>
            <p>...depending on how many images were uploaded</p>
            <p>Enjoy some jokes in the meantime...</p>
            <p className="dad-joke"></p>
            <p className="progress-count">
              Extracted text from image {convertedImageCount} of {imageCount}{" "}
            </p>
            <div className="progress-bar-container">
              <p className="progress-bar" style={{ width: `${(convertedImageCount / imageCount) * 100}%` }}></p>
            </div>
          </>
        </Modal>
        {showTextContainer && <ion-icon onClick={toggleJumpToSection} id="toc-icon" name="list-outline"></ion-icon>}
        <div id="table-of-contents">
          <div id="toc-contents">
            <ion-icon onClick={toggleJumpToSection} id="toc-close-icon" name="chevron-forward-outline"></ion-icon>
            {tocHeaders.length > 0 &&
              tocHeaders.sort().map((header, index) => {
                return (
                  <span key={index}>
                    <TableOfContentsListItem
                      agreementText={document.querySelector("#text-container").textContent}
                      text={header}
                      onClick={() => {
                        toggleJumpToSection();
                        scrollToHeader(header);
                      }}
                    />
                  </span>
                );
              })}
          </div>
        </div>
        <div id="text-container" className={showTextContainer === true ? "active" : ""}></div>
        {showTextContainer && (
          <div
            onClick={() => {
              const ref = document.querySelector("#text-container p").firstChild;
              ref.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}>
            <ion-icon id="scroll-icon" name="chevron-up-circle"></ion-icon>
          </div>
        )}
      </div>
    </div>
  );
}
