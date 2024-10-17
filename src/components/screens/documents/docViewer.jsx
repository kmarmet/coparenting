import React, { useContext, useEffect, useState } from 'react'
import ScreenNames from '@screenNames'
import globalState from '../../../context'
import DB from '@db'
import FirebaseStorage from '../../../database/firebaseStorage'
import TableOfContentsListItem from '../../tableOfContentsListItem'
import DocumentConversionManager from '@managers/documentConversionManager'
import ImageManager from '@managers/imageManager'
import Manager from '@manager'
import { useSwipeable } from 'react-swipeable'
import BottomCard from '../../shared/bottomCard'
import { DebounceInput } from 'react-debounce-input'
import {
  toCamelCase,
  getFirstWord,
  formatFileName,
  isAllUppercase,
  removeSpacesAndLowerCase,
  stringHasNumbers,
  wordCount,
  uppercaseFirstLetterOfAllWords,
  spaceBetweenWords,
  formatNameFirstNameOnly,
  removeFileExtension,
  contains,
  uniqueArray,
  getFileExtension,
} from '../../../globalFunctions'
import DB_UserScoped from '@userScoped'
import DocumentsManager from '../../../managers/documentsManager'
import SecurityManager from '../../../managers/securityManager'

export default function DocViewer() {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, formToShow, docToView, navbarButton } = state
  const [tocHeaders, setTocHeaders] = useState([])
  const [showCard, setShowCard] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [searchResultsIndex, setSearchResultsIndex] = useState(1)
  const [showTocButton, setShowTocButton] = useState(true)
  const [showSearch, setShowSearch] = useState(false)
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
    setState({ ...state, isLoading: true })
    if (currentUser && fileType === '.docx') {
      await getDoc()
    } else {
      await getImage()
    }
  }

  const expandImage = (e) => {
    const modal = document.querySelector('.image-modal')
    modal.classList.add('show')
    ImageManager.expandImage(e, modal)
  }

  const deleteDoc = async (path, record) => {
    console.log(path)
    const imageName = FirebaseStorage.getImageNameFromUrl(path)

    // Delete from Firebase Realtime DB
    await DB.deleteImage(DB.tables.users, currentUser, theme, record.id, 'documents')
      .then(() => {
        convertAndAppendDocOrImage()
      })
      .finally(async () => {
        // Delete from Firebase Storage
        await FirebaseStorage.delete(FirebaseStorage.directories.documents, currentUser.id, imageName)
      })
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
        let foundElement = allPars.filter((x) => x.textContent.toLowerCase().contains(searchValue.toLowerCase()))[0]
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
    const coparentDocsObjects = await DocumentsManager.getCoparentDocs(currentUser)
    const docsFromObject = coparentDocsObjects.map((x) => x.docs)
    const coparentsFromObject = coparentDocsObjects.map((x) => x.coparent)
    const relevantDoc = docsFromObject.filter((x) => x.name === docToView.name)[0]
    let userIdToUse = currentUser.id

    if (Manager.isValid(relevantDoc)) {
      const uploadedByPhone = relevantDoc.uploadedBy
      const relevantCoparent = coparentsFromObject.filter((x) => x.phone === uploadedByPhone)[0]
      userIdToUse = relevantCoparent.id
    }

    // Insert HTML
    const docHtml = await DocumentConversionManager.docToHtml(fileName, userIdToUse)
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

    // Cleanup unecessary header classes
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
      if (newHeaderArray.indexOf(text) === -1 && header.textContent.wordCount() < 10) {
        newHeaderArray.push(text)
      }
    })
    setTocHeaders(newHeaderArray.sort())
    setState({ ...state, isLoading: false, showBackButton: true, showMenuButton: false })
  }

  // Get/Append Image
  const getImage = async () => {
    const coparentDocsObjects = await SecurityManager.getDocuments(currentUser)
    const docsFromObject = coparentDocsObjects.map((x) => x.docs)
    const coparentsFromObject = coparentDocsObjects.map((x) => x.coparent)
    const relevantDoc = docsFromObject.filter((x) => x.name === docToView.name)[0]
    let userIdToUse = currentUser.id

    if (Manager.isValid(relevantDoc)) {
      const uploadedByPhone = relevantDoc.uploadedBy
      const relevantCoparent = coparentsFromObject.filter((x) => x.phone === uploadedByPhone)[0]
      userIdToUse = relevantCoparent.id
    }

    const imagePath = await FirebaseStorage.getImageAndUrl(FirebaseStorage.directories.documents, userIdToUse, docToView.name)
    await DocumentConversionManager.imageToTextAndAppend(imagePath.imageUrl, document.querySelector('#text-container')).finally(() => {
      setState({ ...state, isLoading: false, previousScreen: ScreenNames.docsList, showBackButton: true, showMenuButton: false })
      Manager.toggleForModalOrNewForm('show')
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

  useEffect(() => {
    document.getElementById('text-container').innerText = ''
    Manager.toggleForModalOrNewForm('show')
    convertAndAppendDocOrImage().then((r) => r)

    setState({
      ...state,
      navbarButton: {
        action: () => {
          console.log('here')
          setShowSearch(true)
        },
        icon: 'search',
        formToShow: 'search',
      },
    })
  }, [])

  return (
    <div className="doc-viewer-container">
      {/* BOTTOM ACTIONS */}
      <div className={`${theme} flex form`} id="bottom-actions">
        {showTocButton && Manager.isValid(document.querySelectorAll('.header'), true) && (
          <div id="toc-button" className={`${theme}`} onClick={() => setShowCard(true)}>
            Table of Contents <span className="pl-10 fs-20 material-icons-round">format_list_bulleted</span>
          </div>
        )}
      </div>
      {/* INPUT */}
      <BottomCard
        className="form search-card"
        showCard={showSearch}
        title={'Search'}
        onClose={() => {
          setState({ ...state, formToShow: '' })
          closeSearch()
        }}>
        <div className="flex">
          <DebounceInput minLength={3} id="search-input" onChange={(e) => search(e.target.value)} debounceTimeout={500} />
          {/* SEARCH NAV */}
          {searchResults.length > 0 && (
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
      </BottomCard>

      {/* TABLE OF CONTENTS */}
      {Manager.isValid(document.querySelectorAll('.header'), true) && (
        <BottomCard showCard={showCard} onClose={() => setShowCard(false)} className="toc" title={'Table of Contents'}>
          <div id="table-of-contents">
            <button
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
        </BottomCard>
      )}

      <div id="documents-container" className={`${theme} page-container form`}>
        <div id="text-container"></div>
      </div>
    </div>
  )
}
