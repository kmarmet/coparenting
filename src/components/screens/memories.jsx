// Path: src\components\screens\memories?.jsx
import Accordion from "@mui/material/Accordion"
import AccordionDetails from "@mui/material/AccordionDetails"
import AccordionSummary from "@mui/material/AccordionSummary"
import React, {useContext, useEffect, useState} from "react"
import {IoMdPhotos} from "react-icons/io"
import ScreenNames from "../../constants/screenNames"
import globalState from "../../context"
import DB from "../../database/DB"
import Storage from "../../database/storage"
import useCurrentUser from "../../hooks/useCurrentUser"
import useMemories from "../../hooks/useMemories"
import DomManager from "../../managers/domManager"
import ImageManager from "../../managers/imageManager"
import Manager from "../../managers/manager"
import StringManager from "../../managers/stringManager"
import NavBar from "../navBar"
import AccordionTitle from "../shared/accordionTitle"
import Screen from "../shared/screen"
import ScreenHeader from "../shared/screenHeader"
import Slideshow from "../shared/slideshow"
import Spacer from "../shared/spacer"

export default function Memories() {
    const {state, setState} = useContext(globalState)
    const {theme} = state

    // State
    const [showDisclaimer, setShowDisclaimer] = useState(false)
    const [showSlideshow, setShowSlideshow] = useState(false)
    const [activeImgIndex, setActiveImgIndex] = useState(0)

    // Hooks
    const {currentUser, currentUserIsLoading} = useCurrentUser()
    const {memories, memoriesAreLoading} = useMemories()

    const DeleteMemory = async (firebaseImagePath, record) => {
        const imageName = Storage.GetImageNameFromUrl(firebaseImagePath)

        // Current user is record owner
        if (record?.owner?.key === currentUser?.key) {
            // Delete from Firebase Realtime DB
            await DB.deleteMemory(currentUser?.key, record).then(async () => {
                // Delete from Firebase Storage
                await Storage.delete(Storage.directories.memories, currentUser?.key, imageName)
            })
        }
        // Memory was shared with current user -> hide it
        else {
            const memoryKey = DB.GetIndexById(memories, record?.id)
            if (Manager.IsValid(memoryKey)) {
                const updatedShareWith = record.shareWith.filter((x) => x?.owner?.key !== currentUser?.key)
                await DB.updateByPath(`${DB.tables.memories}/${record?.ownerKey}/${memoryKey}/shareWith`, updatedShareWith)
            }
        }
        setState({...state, bannerMessage: "Memory Deleted", refreshKey: Manager.GetUid()})
    }

    const SaveMemoryImage = (imgSrc) => {
        if (Manager.IsValid(imgSrc)) {
            ImageManager.saveImageFromUrl(null, imgSrc)
        }
    }

    useEffect(() => {
        if (Manager.IsValid(memories)) {
            const memoryElements = document.querySelectorAll(".memory-wrapper")

            if (Manager.IsValid(memoryElements)) {
                DomManager.AddActiveClassWithDelay(memoryElements, 1)
            }
        }
    }, [memories, memoriesAreLoading])

    return (
        <Screen activeScreen={ScreenNames.memories} loadingByDefault={true} stopLoadingBool={!currentUserIsLoading && !memoriesAreLoading}>
            {/* SLIDESHOW */}
            <Slideshow show={showSlideshow} hide={() => setShowSlideshow(false)} images={memories} activeIndex={activeImgIndex} />

            {/* PAGE CONTAINER */}
            <div id="memories-container" className={`${theme} page-container`}>
                <ScreenHeader
                    titleIcon={<IoMdPhotos />}
                    title={"Memories"}
                    screenName={ScreenNames.memories}
                    screenDescription={"Share photos of unforgettable memories that deserve to be seen!"}
                />
                <Spacer height={10} />
                <div className="screen-content">
                    <Accordion className={`${theme} white-bg memories-accordion accordion`} expanded={showDisclaimer}>
                        <AccordionSummary>
                            <AccordionTitle
                                titleText={"Memory Expiration"}
                                toggleState={showDisclaimer}
                                onClick={() => setShowDisclaimer(!showDisclaimer)}
                            />
                        </AccordionSummary>
                        <Spacer height={5} />
                        <AccordionDetails>
                            <p>
                                All images will be automatically and <b>permanently</b> removed 30 days after the date they were uploaded. You are
                                welcome to download them at any time.
                            </p>
                        </AccordionDetails>
                    </Accordion>

                    {/* NO DATA FALLBACK TEXT */}
                    {memories && memories?.length === 0 && <p className={"no-data-fallback-text"}>No Memories</p>}

                    {/*/!* GALLERY *!/*/}
                    {Manager.IsValid(memories) &&
                        memories?.map((imgObj, index) => {
                            return (
                                <div className={`memory memory-wrapper ${theme}`} key={index}>
                                    {/* IMAGE WRAPPER */}
                                    <div
                                        id="memory-image-wrapper"
                                        onClick={() => {
                                            setActiveImgIndex(index)
                                            setShowSlideshow(true)
                                        }}>
                                        {/* TITLE */}
                                        {Manager.IsValid(imgObj?.title, true) && (
                                            <p className="memory-title">{StringManager.FormatTitle(imgObj?.title, true)}</p>
                                        )}

                                        {/* IMAGE */}
                                        {Manager.IsValid(imgObj?.url, true) && (
                                            <div style={{backgroundImage: `url(${imgObj?.url})`}} className="memory-image"></div>
                                        )}
                                    </div>
                                    <Spacer height={5} />
                                    {/* BELOW IMAGE */}
                                    <div id="below-image">
                                        {/* DELETE BUTTON */}
                                        <p onClick={() => DeleteMemory(imgObj?.url, imgObj)} id="delete-button">
                                            DELETE
                                        </p>
                                        {/* DOWNLOAD BUTTON */}
                                        <p onClick={() => SaveMemoryImage(imgObj?.url)} id="download-button">
                                            DOWNLOAD
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                </div>
            </div>
            <NavBar navbarClass={"memories"} />
        </Screen>
    )
}