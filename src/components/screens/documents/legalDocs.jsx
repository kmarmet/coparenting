import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from 'constants/screenNames'
import globalState from '../../../context'
import Manager from 'managers/manager'
import FirebaseStorage from '../../../database/firebaseStorage'
import Modal from 'components/shared/modal'
// import DocManager from 'managers/docManager'
import TableOfContentsListItem from '../../tableOfContentsListItem'
import DadJokes from '../../../api/dadJokes'
import { useSwipeable } from 'react-swipeable'

export default function ImageDocs() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showTextContainer, setShowTextContainer] = useState(false)
  const [convertedImageCount, setConvertedImageCount] = useState(0)
  const [imageCount, setImageCount] = useState(0)

  const handlers = useSwipeable({
    onSwipedRight: (eventData) => {
      console.log('User Swiped!', eventData)
      setState({ ...state, currentScreen: ScreenNames.calendar })
    },
  })

  const scrollToHeader = (header) => {
    const el = document.querySelector(`[data-header-name='${header.replaceAll(' ', '-').replaceAll(',', '-')}']`)
    el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  const toggleJumpToSection = () => {
    const toc = document.querySelector('#table-of-contents')
    const overlay = document.querySelector('.overlay')
    if (toc.classList.contains('open')) {
      toc.classList.remove('open')
      overlay.classList.remove('active')
    } else {
      toc.classList.add('open')
      overlay.classList.add('active')
    }
  }

  const dadJokes = async () => {
    if (document.querySelector('.modal .dad-joke') !== null) {
      await DadJokes.getJoke.then((joke) => {
        document.querySelector('.modal .dad-joke').textContent = joke
      })
    }
  }

  const getImages = async () => {
    // Get Firebase images
    FirebaseStorage.getImages(FirebaseStorage.directories.documents, currentUser?.id)
      .then(async (imgs) => {
        if (imgs.length === 0) {
          setState({ ...state, currentScreenTitle: 'Upload Agreement', currentScreen: ScreenNames.uploadAgreement })
        } else {
          setImageCount(imgs.length)

          Promise.all(imgs).then(async (allImagePaths) => {
            let pageCounter = 0
            for (let path of allImagePaths) {
              await DocManager.imageToTextAndAppend(path, document.querySelector('#text-container'))
              pageCounter++
              setConvertedImageCount(pageCounter)

              // Done extracting text
              if (pageCounter >= allImagePaths.length) {
                setShowTextContainer(true)

                // Filter TOC
                const spanHeaders = document.querySelectorAll('.header')
                let newHeaderArray = []
                spanHeaders.forEach((header) => {
                  const text = header.textContent.replaceAll(' ', '-')
                  if (newHeaderArray.indexOf(text) === -1) {
                    newHeaderArray.push(text)
                  }
                })
                setTocHeaders(newHeaderArray)
              }
            }
          })
        }
      })
      .catch((error) => {
        if (error.toString().indexOf('does not exist') > -1) {
          setState({ ...state, currentScreenTitle: 'Upload Agreement', currentScreen: ScreenNames.uploadAgreement })
        }
      })
  }

  useEffect(() => {
    if (currentUser) {
      // Show dad jokes while loading
      if (imageCount > 0) {
        dadJokes()
        const jokeInterval = setInterval(() => {
          dadJokes()
        }, [7000])

        // Stop jokes and show text container
        setTimeout(() => {
          clearInterval(jokeInterval)
        }, [102000])
      }

      // Get all images
      getImages()
    }
    Manager.showPageContainer()
  }, [])

  return (
    <>
      <p className="screen-title ">Legal Documents</p>
      <div id="legal-docs-container" className={`${theme} page-container form`} {...handlers}>
        <div className="overlay"></div>
        <div className="form">
          <Modal elClass={!showTextContainer ? 'show dad-joke' : 'dad-joke'} hasClose={false}>
            <>
              <p>
                <b>This can take up to 2 minutes (depending on how many images were uploaded)</b>
              </p>
              <br />
              <p>Enjoy some jokes in the meantime...</p>
              <p className="dad-joke"></p>
              <p className="progress-count">
                Extracting text from image {convertedImageCount} of {imageCount}{' '}
              </p>
              <div className="progress-bar-container">
                <p className="progress-bar" style={{ width: `${(convertedImageCount / imageCount) * 100}%` }}></p>
              </div>
              <img className={'active'} src={require('../../../img/loading.gif')} id="loading-gif" />
            </>
          </Modal>

          {showTextContainer && <ion-icon onClick={toggleJumpToSection} id="toc-icon" name="list-outline"></ion-icon>}
          <div id="table-of-contents">
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  console.log(header)
                  return (
                    <span key={index}>
                      <TableOfContentsListItem
                        agreementText={document.querySelector('#text-container').textContent}
                        text={header}
                        onClick={() => {
                          toggleJumpToSection()
                          scrollToHeader(header)
                        }}
                      />
                    </span>
                  )
                })}
            </div>
            <ion-icon onClick={toggleJumpToSection} id="toc-close-icon" name="chevron-forward-outline"></ion-icon>
          </div>
          <div id="text-container" className={showTextContainer === true ? 'active' : ''}></div>
          {showTextContainer && (
            <div
              onClick={() => {
                Manager.scrollToTopOfPage()
              }}>
              <ion-icon id="scroll-icon" name="chevron-up-circle"></ion-icon>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
