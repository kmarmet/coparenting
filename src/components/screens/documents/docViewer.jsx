import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../../context'
import FirebaseStorage from '../../../database/firebaseStorage'
import TableOfContentsListItem from '../../tableOfContentsListItem'
import DocumentConversionManager from '@managers/documentConversionManager'
import Manager from '@manager'
import BottomCard from '../../shared/bottomCard'
import { DebounceInput } from 'react-debounce-input'
import {
  contains,
  formatFileName,
  formatNameFirstNameOnly,
  getFileExtension,
  getFirstWord,
  hasClass,
  isAllUppercase,
  removeFileExtension,
  removeSpacesAndLowerCase,
  spaceBetweenWords,
  stringHasNumbers,
  toCamelCase,
  uniqueArray,
  uppercaseFirstLetterOfAllWords,
  wordCount,
} from '../../../globalFunctions'
import SecurityManager from '../../../managers/securityManager'

import { AiOutlineFileSearch } from 'react-icons/ai'
import NavBar from '../../navBar'
import DB from '@db'
import AlertManager from '../../../managers/alertManager'

export default function DocViewer() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, docToView } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showCard, setShowCard] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchResultsIndex, setSearchResultsIndex] = useState(1)
  const [showSearch, setShowSearch] = useState(false)
  const [searchResultsCount, setSearchResultsCount] = useState(0)

  const scrollToHeader = (header) => {
    closeSearch()
    const firstChar = header.slice(0, 1)
    if (firstChar === '-') {
      header = header.replace('-', '')
    }
    const el = document.querySelector(`.header[data-header-date='${header}']`)
    setTimeout(() => {
      if (el) {
        el.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 500)
  }
  const convertAndAppendDocOrImage = async () => {
    const fileType = `.${getFileExtension(docToView.name)}`
    if (currentUser && fileType === '.docx') {
      await getDoc()
    } else {
      await getImage()
    }
  }

  const search = (searchValue) => {
    let allPars = document.querySelectorAll('#text-container p')
    allPars.forEach((par) => {
      par.classList.add('low-opacity')
    })
    allPars = Array.from(allPars)

    if (searchValue.length === 0) {
      allPars.forEach((par) => par.classList.remove('search-highlight'))
    } else {
      // Allow search
      if (searchValue.length > 3) {
        let resultsFound = allPars.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))
        setSearchResultsCount(resultsFound.length)
        let foundElement = allPars.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))[0]
        console.log(foundElement)
        let allParsNodes = document.querySelectorAll('#text-container p')
        allParsNodes = Array.from(allParsNodes)
        allParsNodes = allParsNodes.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))
        setSearchResults(allParsNodes)
        if (foundElement) {
          foundElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
          foundElement.classList.add('search-highlight')
          foundElement.classList.remove('low-opacity')
        }
      } else {
        allPars.forEach((par) => par.classList.remove('search-highlight'))
      }
    }
  }

  const searchTraverse = (direction) => {
    let allPars = document.querySelectorAll('#text-container p')
    let currentIndex = searchResultsIndex

    // TOGGLE UP/DOWN ARROWS BASED ON EXISTENCE OF FOUND ELEMENT
    const preFoundElement = direction === 'up' ? searchResults[(currentIndex -= 1)] : searchResults[(currentIndex += 1)]
    if (preFoundElement) {
      // Remove highlight class by default
      allPars = Array.from(allPars)
      allPars.forEach((par) => {
        par.classList.remove('search-highlight')
        par.classList.add('low-opacity')
      })

      // Update index state on nav arrow click
      if (direction === 'up') {
        setSearchResultsIndex((searchResultsIndex) => (searchResultsIndex -= 1))
      } else {
        setSearchResultsIndex((searchResultsIndex) => (searchResultsIndex += 1))
      }

      setTimeout(() => {
        const foundElement = searchResults[searchResultsIndex]
        if (foundElement) {
          // Scroll to next index / add class
          setTimeout(() => {
            foundElement.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }, 200)
          foundElement.classList.add('search-highlight')
          foundElement.classList.remove('low-opacity')
        }
      }, 200)
    }
  }

  const closeSearch = () => {
    Manager.resetForm('doc-viewer-container')
    document.getElementById('search-input').value = ''
    let allHeaders = document.querySelectorAll('.header')
    let allPars = document.querySelectorAll('#text-container p')
    allPars = Array.from(allPars)
    allPars.forEach((par) => {
      par.classList.remove('search-highlight')
      par.classList.remove('low-opacity')
    })
    setSearchResults([])
    setSearchResultsIndex(0)
    setShowSearch(false)
    allHeaders = Array.from(allHeaders)
    if (Manager.isValid(allHeaders, true)) {
      allHeaders[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }

  // Get/Append Doc
  const getDoc = async () => {
    const url = docToView.url
    const fileName = FirebaseStorage.getImageNameFromUrl(url)
    const textContainer = document.getElementById('text-container')

    const coparentDocsObjects = await SecurityManager.getDocuments(currentUser)
    if (!Manager.isValid(coparentDocsObjects, true)) {
      setState({ ...state, isLoading: false })
      return false
    }

    const coparentsFromObject = coparentDocsObjects.map((x) => x.coparent)
    if (!Manager.isValid(coparentsFromObject, true)) {
      setState({ ...state, isLoading: false })
      return false
    }
    const relevantDoc = coparentDocsObjects.filter((x) => x?.name === docToView?.name)[0]
    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      return false
    }

    // Insert HTML
    const docHtml = await DocumentConversionManager.docToHtml(fileName, currentUser.id)
    textContainer.innerHTML = docHtml

    // Format HTML
    const pars = textContainer.querySelectorAll('p, li')
    const listItems = textContainer.querySelectorAll('li')
    const containsLettersRegex = /[a-zA-Z]/g

    // List Item formatting
    listItems.forEach((listItem, index) => {
      if (stringHasNumbers(listItem.textContent) && listItem.textContent.toLowerCase().indexOf('article') > -1) {
        listItem.classList.add('highlight')
      }
      if (isAllUppercase(listItem.textContent) && !listItem.classList.contains('header')) {
        listItem.classList.add('highlight')
      }
      if (stringHasNumbers(listItem.textContent)) {
        listItem.classList.add('highlight')
      }
      if (listItem.classList.contains('highlight')) {
        const header = listItem.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
        listItem.setAttribute('data-header-date', header)
      }
      const allStrongs = listItem.querySelectorAll('strong')
      allStrongs.forEach((thisStrong) => {
        DocumentConversionManager.addHeaderClass(thisStrong)
      })
      DocumentConversionManager.addHeaderClass(listItem)
      if (wordCount(listItem.textContent) > 10) {
        listItem.classList.remove('highlight')
      }
    })

    // Header formatting
    pars.forEach((par, index) => {
      if (stringHasNumbers(par.textContent) && par.textContent.toLowerCase().indexOf('article') > -1) {
        par.classList.add('header')
        par.classList.add('w-100')
      }
      if (isAllUppercase(par.textContent) && !par.classList.contains('header')) {
        par.classList.add('highlight')
      }

      const allStrongs = par.querySelectorAll('strong')
      allStrongs.forEach((thisStrong) => {
        DocumentConversionManager.addHeaderClass(thisStrong)
      })
      DocumentConversionManager.addHeaderClass(par)
    })

    // Cleanup unnecessary header classes
    pars.forEach((par) => {
      if (!containsLettersRegex.test(par.textContent)) {
        par.classList.remove('header', 'highlight')
        par.remove()
      }
      if (contains(par.textContent, '___')) {
        par.textContent.replace(/_/g, '')
      }
      if (wordCount(par.textContent) > 10) {
        par.classList.remove('header')
      }
      if (par.classList.contains('header')) {
        const header = par.textContent.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
        par.setAttribute('data-header-date', header)
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
      if (newHeaderArray.indexOf(text) === -1 && wordCount(header.textContent) < 10) {
        newHeaderArray.push(text)
      }
    })
    setTocHeaders(newHeaderArray.sort())
  }

  // Get/Append Image
  const getImage = async () => {
    const allDocs = await SecurityManager.getDocuments(currentUser)
    if (!Manager.isValid(allDocs, true)) {
      setState({ ...state, isLoading: false })
      return false
    }

    const coparentsFromObject = allDocs.map((x) => x.coparent)

    if (!Manager.isValid(coparentsFromObject, true)) {
      setState({ ...state, isLoading: false })
      return false
    }
    const relevantDoc = await DB.find(DB.tables.documents, ['name', docToView.name], true)
    let docOwner = await DB.find(DB.tables.users, ['phone', relevantDoc.uploadedBy])
    const firebasePathId = docOwner.id

    if (!Manager.isValid(relevantDoc)) {
      setState({ ...state, isLoading: false })
      AlertManager.throwError('No Document Found')
      return false
    }
    const imageResult = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, firebasePathId, docToView.name)
    if (imageResult.status === 'success') {
      await DocumentConversionManager.imageToTextAndAppend(imageResult.imageUrl, document.querySelector('#text-container')).finally(() => {
        Manager.showPageContainer('show')
      })
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

  // Show search icon when text is loaded
  useEffect(() => {
    if (Manager.isValid(tocHeaders, true)) {
      setState({ ...state, isLoading: false })
    }
  }, [tocHeaders])

  useEffect(() => {
    setState({ ...state, isLoading: true })
    document.getElementById('text-container').innerText = ''
    Manager.showPageContainer()
    convertAndAppendDocOrImage().then((r) => r)
  }, [])

  return (
    <div className="doc-viewer-container">
      <p className="screen-title pt-10">Doc Viewer</p>
      {/* BOTTOM ACTIONS */}
      <div className={`${theme} flex form`} id="bottom-actions">
        {Manager.isValid(document.querySelectorAll('.header'), true) && (
          <div id="toc-button" className={`${theme}`} onClick={() => setShowCard(true)}>
            Table of Contents <span className="pl-10 fs-20 material-icons-round">format_list_bulleted</span>
          </div>
        )}
      </div>
      {/* INPUT */}
      <BottomCard className="form search-card" showCard={showSearch} title={'Search'} onClose={() => closeSearch}>
        <div className="flex">
          <DebounceInput minLength={3} id="search-input" onChange={(e) => search(e.target.value)} debounceTimeout={500} />
          {/* SEARCH NAV */}
          {searchResults.length > 0 && searchResultsCount > 1 && (
            <div id="input-and-nav">
              {/* NAVIGATION */}
              <div className="flex">
                <span className="material-icons-round" onClick={() => searchTraverse('up')}>
                  arrow_upward
                </span>
                <span className="material-icons-round" onClick={() => searchTraverse('down')}>
                  arrow_downward
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="buttons">
          <button className="card-button cancel" onClick={closeSearch}>
            Close
          </button>
        </div>
      </BottomCard>

      {/* TABLE OF CONTENTS */}
      {Manager.isValid(document.querySelectorAll('.header'), true) && (
        <BottomCard showCard={showCard} onClose={() => setShowCard(false)} className="toc" title={'Table of Contents'}>
          <div id="table-of-contents">
            <button
              id="toc-scroll-button"
              className="button default center mt-5"
              onClick={() => {
                setShowCard(false)
                let allHeaders = document.querySelectorAll('.header')
                if (Manager.isValid(allHeaders, true)) {
                  allHeaders = Array.from(allHeaders)
                  allHeaders[0].scrollIntoView({ block: 'center', behavior: 'smooth' })
                }
              }}>
              Scroll to top
            </button>
            <div id="toc-contents">
              {tocHeaders.length > 0 &&
                tocHeaders.sort().map((header, index) => {
                  header = header.replace(/ /g, '-').replace(/[0-9]/g, '').replace('.', '').replace(/\s/g, '')
                  return (
                    <span key={index}>
                      {!header.contains('___') && (
                        <TableOfContentsListItem
                          agreementText={document.querySelector('#text-container').textContent}
                          text={`• ${header}`}
                          dataHeader={header}
                          onClick={() => {
                            setShowCard(false)
                            scrollToHeader(header)
                          }}
                        />
                      )}
                    </span>
                  )
                })}
            </div>
          </div>
          <div className="buttons">
            <button className="card-button cancel" onClick={() => setShowCard(false)}>
              Close
            </button>
          </div>
        </BottomCard>
      )}

      <div id="documents-container" className={`${theme} page-container form`}>
        <div id="text-container"></div>
      </div>
      {!showSearch && !showCard && (
        <NavBar>
          <AiOutlineFileSearch id={'add-new-button'} onClick={() => setShowSearch(true)} />
        </NavBar>
      )}
    </div>
  )
}