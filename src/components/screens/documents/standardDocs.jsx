import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import DB from '@db'
import FirebaseStorage from '../../../database/firebaseStorage'
import TableOfContentsListItem from '../../legalDocToc'
import Modal from '@shared/modal'
import DocManager from '@managers/docManager'
import ImageManager from '@managers/imageManager'
import Manager from '@manager'
import { useSwipeable } from 'react-swipeable'
import BottomCard from '../../shared/bottomCard'
import { DebounceInput } from 'react-debounce-input'

export default function StandardDocs() {
  const { state, setState } = useContext(globalState)
  const { currentUser, previousScreen, currentScreen, docToView } = state
  const [images, setImages] = useState([])
  const [loadedImages, setLoadedImages] = useState(1)
  const [imageCount, setImageCount] = useState(0)
  const [isDoneLoading, setIsDoneLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [tocHeaders, setTocHeaders] = useState([])
  const [screenTitle, setScreenTitle] = useState('Document')
  const [showCard, setShowCard] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchResultsIndex, setSearchResultsIndex] = useState(0)

  const scrollToHeader = (header) => {
    closeSearch()
    const el = document.querySelector(`[data-header-name='${header.replaceAll(',', '-')}']`)
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  const getDocsAndImages = async () => {
    if (currentUser) {
      setState({ ...state, isLoading: true })
      const url = docToView.url
      const fileName = FirebaseStorage.getImageNameFromUrl(url)
      const textContainer = document.getElementById('text-container')

      // Set dynamic screen title
      setScreenTitle(fileName.removeFileExtension())

      // Insert HTML
      const docHtml = await DocManager.docToHtml(fileName, currentUser.id)
      textContainer.innerHTML = docHtml

      // Format HTML
      const pars = textContainer.querySelectorAll('p, li')
      const listItems = textContainer.querySelectorAll('li')
      const containsLettersRegex = /[a-zA-Z]/g

      // List Item formatting
      listItems.forEach((listItem, index) => {
        if (listItem.textContent.stringHasNumbers() && listItem.textContent.toLowerCase().indexOf('article') > -1) {
          listItem.classList.add('highlight')
        }
        if (listItem.textContent.isAllUppercase() && !listItem.classList.contains('header')) {
          listItem.classList.add('highlight')
        }
        if (listItem.textContent.stringHasNumbers()) {
          listItem.classList.add('highlight')
        }
        if (listItem.classList.contains('highlight')) {
          const header = listItem.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
          listItem.setAttribute('data-header-name', header)
        }
        const allStrongs = listItem.querySelectorAll('strong')
        allStrongs.forEach((thisStrong) => {
          DocManager.addHeaderClass(thisStrong)
        })
        DocManager.addHeaderClass(listItem)
        if (listItem.textContent.wordCount() > 10) {
          listItem.classList.remove('highlight')
        }
      })

      // Header formatting
      pars.forEach((par, index) => {
        if (par.textContent.stringHasNumbers() && par.textContent.toLowerCase().indexOf('article') > -1) {
          par.classList.add('header')
          par.classList.add('w-100')
        }
        if (par.textContent.isAllUppercase() && !par.classList.contains('header')) {
          par.classList.add('highlight')
        }

        const allStrongs = par.querySelectorAll('strong')
        allStrongs.forEach((thisStrong) => {
          DocManager.addHeaderClass(thisStrong)
        })
        DocManager.addHeaderClass(par)
      })

      // Cleanup unecessary header classes
      pars.forEach((par) => {
        if (!containsLettersRegex.test(par.textContent)) {
          par.classList.remove('header', 'highlight')
          par.remove()
        }
        if (par.textContent.contains('___')) {
          par.textContent.replace(/_/g, '')
        }
        if (par.textContent.wordCount() > 10) {
          par.classList.remove('header')
        }
        if (par.classList.contains('header')) {
          const header = par.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
          par.setAttribute('data-header-name', header)
        }
      })

      // Set TOC headers
      const headers = document.querySelectorAll('.header, li.highlight, span.highlight, .toc-header')
      let newHeaderArray = []
      headers.forEach((header) => {
        const text = header.textContent
          .replaceAll(' ', '-')
          .replaceAll('-', ' ')
          .replace(/ /g, '-')
          .replace(/[0-9]/g, '')
          .replace('.', '')
          .replace(/\s/g, '')
          .replaceAll('•', '')
        if (newHeaderArray.indexOf(text) === -1 && header.textContent.wordCount() < 10) {
          newHeaderArray.push(text)
        }
      })
      setTocHeaders(newHeaderArray.sort())
      setState({ ...state, isLoading: false })
    }
  }

  const navigateToImage = (direction) => {
    const img = document.querySelector('#modal-img')
    const src = img.getAttribute('src')
    let imgIndex
    let imageUrls = images.map((x) => x.url)
    imgIndex = imageUrls.findIndex((x) => x === src)

    if (imgIndex > -1 && imgIndex + 1 < images.length) {
      if (direction === 'forward') {
        img.src = images[imgIndex + 1].url
      } else {
        if (images[imgIndex - 1] === undefined) {
          img.src = images[images.length - 1].url
        } else {
          img.src = images[imgIndex - 1].url
        }
      }
    } else {
      if (images[0] !== undefined) {
        img.src = images[0].url
      }
    }
  }

  const expandImage = (e) => {
    setShowModal(true)
    const modal = document.querySelector('.image-modal')
    modal.classList.add('show')
    ImageManager.expandImage(e, modal)
  }

  const deleteDoc = async (path, record) => {
    const imageName = await FirebaseStorage.getImageNameFromUrl(path)

    // Delete from Firebase Realtime DB
    await DB.deleteImage(DB.tables.users, currentUser, record.id, 'documents')
      .then(() => {
        getDocsAndImages()
      })
      .finally(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.documents, currentUser.id, imageName)
      })
  }

  const search = (searchValue) => {
    let allPars = document.querySelectorAll('#text-container p')
    allPars = Array.from(allPars)

    if (searchValue.length === 0) {
      allPars.forEach((par) => par.classList.remove('search-highlight'))
    } else {
      let foundElement = allPars.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))[0]
      let allParsNodes = document.querySelectorAll('#text-container p')
      allParsNodes = Array.from(allParsNodes)
      allParsNodes = allParsNodes.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))
      setSearchResults(allParsNodes)
      if (foundElement) {
        foundElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
        foundElement.classList.add('search-highlight')
      }
    }
  }

  const searchTraverse = (direction) => {
    let allPars = document.querySelectorAll('#text-container p')

    // Remove highlight class by default
    allPars = Array.from(allPars)
    allPars.forEach((par) => par.classList.remove('search-highlight'))

    // Update index state on nav arrow click
    if (direction === 'up') {
      setSearchResultsIndex((searchResultsIndex) => (searchResultsIndex -= 1))
    } else {
      setSearchResultsIndex((searchResultsIndex) => (searchResultsIndex += 1))
    }

    const foundElement = searchResults[searchResultsIndex]
    if (foundElement) {
      // Scroll to next index / add class
      setTimeout(() => {
        foundElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }, 200)
      foundElement.classList.add('search-highlight')
    }
  }

  const closeSearch = () => {
    let allHeaders = document.querySelectorAll('.header')
    let allPars = document.querySelectorAll('#text-container p')
    document.getElementById('search-input').value = ''
    allPars = Array.from(allPars)
    allPars.forEach((par) => par.classList.remove('search-highlight'))
    setSearchResults([])
    setSearchResultsIndex(0)
    allHeaders = Array.from(allHeaders)
    allHeaders[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
  }

  useEffect(() => {
    if (imageCount > 0 && loadedImages === imageCount) {
      document.querySelectorAll('.agreement-image').forEach((img) => {
        if (img.complete) {
          setIsDoneLoading(true)
        }
      })
    }
  }, [loadedImages])

  useEffect(() => {
    setState({ ...state, previousScreen: ScreenNames.docsList, showBackButton: true, showMenuButton: false })
    Manager.toggleForModalOrNewForm('show')
    getDocsAndImages().then((r) => r)
  }, [])

  return (
    <>
      <p className="screen-title" id="documents-screen-title">
        {screenTitle}
      </p>
      <div id="toc-button" className="blue" onClick={() => setShowCard(true)}>
        Table of Contents <span className="pl-10 fs-20 blue material-icons-round">format_list_bulleted</span>
      </div>

      <div id="documents-container">
        {/* SEARCH WRAPPER */}
        <div id="search-wrapper" className={searchResults.length > 0 ? 'w-100 form m-0' : 'form'}>
          <label>Enter 3 letters or more to search this document</label>
          <div className={searchResults.length > 0 ? 'flex input-and-nav onscroll' : 'flex input-and-nav'}>
            {/* INPUT */}
            <input
              type="text"
              className={searchResults.length > 0 ? '' : 'w-100 mr-0'}
              minLength={3}
              id="search-input"
              onChange={(e) => search(e.target.value)}
            />

            {/* NAVIGATION */}
            {searchResults.length > 0 && (
              <div className="flex">
                <span className="material-icons-round" onClick={closeSearch}>
                  close
                </span>
                <span className="material-icons-round ml-5 mr-5" onClick={() => searchTraverse('up')}>
                  arrow_upward
                </span>
                <span className="material-icons-round" onClick={() => searchTraverse('down')}>
                  arrow_downward
                </span>
              </div>
            )}
          </div>
        </div>
        {/* TABLE OF CONTENTS */}
        <BottomCard showCard={showCard} onClose={() => setShowCard(false)} className="toc" title={'Table of Contents'}>
          <div id="table-of-contents">
            <p id="toc-subtitle" className="caption">
              Each item is clickable - Scroll to see more
            </p>
            <button
              className="button default center mt-5"
              onClick={() => {
                setShowCard(false)
                let firstHeader = document.querySelectorAll('.header')
                firstHeader = Array.from(firstHeader)
                firstHeader[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
              }}>
              Scroll to top
            </button>
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  return (
                    <span key={index}>
                      {!header.contains('___') && (
                        <TableOfContentsListItem
                          agreementText={document.querySelector('#text-container').textContent}
                          text={`• ${header}`}
                          onClick={() => {
                            setShowCard(false)
                            scrollToHeader(header.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, ''))
                          }}
                        />
                      )}
                    </span>
                  )
                })}
            </div>
          </div>
        </BottomCard>
        {!showModal && images.length > 0 && imageCount && imageCount > 0 && (
          <>
            <p className="gallery instructions">Click image to expand</p>
            <div className={`gallery ${isDoneLoading ? 'active' : ''}`}>
              {imageCount && imageCount > 0 && (
                <img className={isDoneLoading === true ? '' : 'active'} src={require('../../../img/loading.gif')} id="loading-gif" />
              )}

              {images.length > 0 &&
                images.map((imgObj, index) => {
                  return (
                    <div id="img-container" key={index}>
                      <img
                        data-url={imgObj.url}
                        onLoad={(e) => {
                          setLoadedImages((loadedImages) => loadedImages + 1)
                        }}
                        onClick={(e) => expandImage(e)}
                        src={imgObj.url}
                        onError={(e) => setImages(images.filter((x) => x.id !== imgObj.id))}
                        className="agreement-image"
                      />
                      {imgObj.name && imgObj.name.length > 0 && <p className="image-name">{imgObj.name}</p>}
                      <p onClick={() => deleteDoc(imgObj.url, imgObj)}>DELETE</p>
                    </div>
                  )
                })}
            </div>
          </>
        )}
        <div id="text-container"></div>
      </div>
    </>
  )
}
