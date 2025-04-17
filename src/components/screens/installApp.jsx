// Path: src\components\screens\installApp.jsx
import React, {useContext, useState} from 'react'
import globalState from '../../context'
import {FaApple, FaMinus, FaPlus} from 'react-icons/fa6'
import {BsAndroid2} from 'react-icons/bs'
import {TbDeviceDesktopDown} from 'react-icons/tb'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import DomManager from '../../managers/domManager'
import {MdOutlineIosShare} from 'react-icons/md'
import Spacer from '../shared/spacer'
import NavBar from '../navBar'
import ScreenNames from '../../constants/screenNames'
import Manager from '../../managers/manager'

export default function InstallApp() {
  const {state, setState} = useContext(globalState)
  const {currentUser} = state
  const [expandAppleAccordion, setExpandAppleAccordion] = useState(false)
  const [expandAndroidAccordion, setExpandAndroidAccordion] = useState(false)
  const [expandDesktopAccordion, setExpandDesktopAccordion] = useState(false)
  return (
    <>
      <div className="page-container install-app">
        <div id="install-app-wrapper">
          <p className="screen-title">Installation Instructions</p>
          <p>Install the app in three steps or less! No App Store or Play Store necessary.</p>
          <Spacer height={10} />
          {/* IOS */}
          <Accordion id={'ios'}>
            <AccordionSummary>
              <p className="accordion-header apple" onClick={() => setExpandAppleAccordion(!expandAppleAccordion)}>
                iOS <FaApple className={'apple-logo'} />{' '}
                {expandAppleAccordion ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}
              </p>
            </AccordionSummary>
            <Spacer height={5} />
            <AccordionDetails expanded={expandAppleAccordion.toString()}>
              <div className="os-container apple">
                <p className="while-viewing">While viewing the website in Safari...</p>
                <div className="flex steps">
                  <div className="flex">
                    <span className="step-number">1.</span>
                    <p>
                      {DomManager.tapOrClick(true)} the Share button <MdOutlineIosShare /> in the menu bar
                    </p>
                  </div>

                  <div className="flex">
                    <span className="step-number">2.</span>
                    <p>
                      Scroll and {DomManager.tapOrClick()}
                      <span className="emphasize">Add to Home Screen</span>
                    </p>
                  </div>

                  <div className="flex">
                    <span className="step-number">3.</span>
                    <p>Tap the new icon on your Home Screen</p>
                  </div>

                  <p className="emphasize no-bold more-padding mb-10">
                    If you don’t see Add to Home Screen, you can add it. Scroll down to the bottom of the list, tap Edit Actions, then tap Add to Home
                    Screen.
                  </p>
                </div>
              </div>
            </AccordionDetails>
          </Accordion>

          {/* ANDROID */}
          <Accordion id={'android'}>
            <AccordionSummary>
              <p className="accordion-header android" onClick={(e) => setExpandAndroidAccordion(!expandAndroidAccordion)}>
                Android <BsAndroid2 />
                {expandAndroidAccordion ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}
              </p>
            </AccordionSummary>
            <Spacer height={5} />
            <AccordionDetails expanded={expandAndroidAccordion.toString()}>
              <div className="os-container android">
                <p className="while-viewing">While viewing the website in Chrome (in default web browser)...</p>
                <div className="flex steps">
                  <div className="flex">
                    <span className="step-number">1.</span>
                    <p>Tap the menu icon</p>
                  </div>

                  <div className="flex">
                    <span className="step-number">2.</span>
                    <p>
                      Tap <span className="emphasize">Add to Home Screen</span>
                    </p>
                  </div>

                  <div className="flex">
                    <span className="step-number">3.</span>
                    <p>Choose a name for the website shortcut</p>
                  </div>

                  <div className="flex">
                    <span className="step-number">4.</span>
                    <p>Tap on the new icon on your Home Screen</p>
                  </div>
                </div>
              </div>
            </AccordionDetails>
          </Accordion>

          {/* DESKTOP */}
          <Accordion id={'pc'}>
            <AccordionSummary>
              <p className="accordion-header desktop" onClick={() => setExpandDesktopAccordion(!expandDesktopAccordion)}>
                Desktop/Laptop <TbDeviceDesktopDown />{' '}
                {expandDesktopAccordion ? <FaMinus className="plus-minus" /> : <FaPlus className="plus-minus" />}
              </p>
            </AccordionSummary>
            <Spacer height={5} />
            <AccordionDetails expanded={expandDesktopAccordion.toString()}>
              <div className="os-container apple">
                <p className="while-viewing">While viewing the website (in default web browser)...</p>
                <div className="flex steps">
                  <img src={require('../../img/desktop-installation.png')} alt="" />
                  <div className="flex mt-15">
                    <span className="step-number">1.</span>
                    <p>Click the installation button in the address bar</p>
                  </div>

                  <div className="flex">
                    <span className="step-number">2.</span>
                    <p>
                      Click <span className="emphasize">Install</span>
                    </p>
                  </div>
                </div>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
      </div>
      {!Manager.isValid(currentUser) && (
        <button id="back-to-login-button" className="button default " onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
          Back to Login
        </button>
      )}
      {Manager.isValid(currentUser) && <NavBar navbarClass={'child-info no-add-new-button'} />}
    </>
  )
}