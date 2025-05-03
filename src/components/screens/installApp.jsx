// Path: src\components\screens\installApp.jsx
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import React, {useContext, useState} from 'react'
import {BsAndroid2} from 'react-icons/bs'
import {FaApple, FaMinus, FaPlus} from 'react-icons/fa6'
import {MdOutlineIosShare} from 'react-icons/md'
import {TbDeviceDesktopDown} from 'react-icons/tb'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import NavBar from '../navBar'
import Spacer from '../shared/spacer'

export default function InstallApp() {
  const {state, setState} = useContext(globalState)

  const {currentUser} = useCurrentUser()
  const [expandAppleAccordion, setExpandAppleAccordion] = useState(false)
  const [expandAndroidAccordion, setExpandAndroidAccordion] = useState(false)
  const [expandDesktopAccordion, setExpandDesktopAccordion] = useState(false)
  return (
    <>
      <div className="page-container install-app">
        <div id="install-app-wrapper">
          <p className="screen-title">Follow the Steps Below</p>
          <p className="screen-intro-text">Install the app in three steps or less! No App Store or Play Store necessary.</p>
          <Spacer height={5} />
          <p className="screen-intro-text">
            {DomManager.tapOrClick(true)} an option below to select the type of device you would like to install the app on
          </p>
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
                    If you don’t see <b className="accent">Add to Home Screen</b>, you can add it. Scroll down to the bottom of the list, tap &nbsp;
                    <b className="accent">Edit Actions</b>, then tap <b className="accent">Add to Home Screen</b>.
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
                <p className="while-viewing">While viewing the website in Chrome (your phone&#39;s default web browser)...</p>
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
        <button className="button default back-to-login-button" onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
          Back to Login
        </button>
      )}
      {Manager.isValid(currentUser) && <NavBar navbarClass={'child-info no-Add-new-button'} />}
    </>
  )
}