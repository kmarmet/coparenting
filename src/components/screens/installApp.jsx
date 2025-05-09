// Path: src\components\screens\installApp.jsx
import React, {useContext, useEffect, useState} from 'react'
import {BsAndroid2} from 'react-icons/bs'
import {FaApple} from 'react-icons/fa6'
import {GrPersonalComputer} from 'react-icons/gr'
import {MdOutlineIosShare} from 'react-icons/md'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import useCurrentUser from '../../hooks/useCurrentUser'
import AppManager from '../../managers/appManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import NavBar from '../navBar'
import Spacer from '../shared/spacer'

export default function InstallApp() {
  const {state, setState} = useContext(globalState)
  const {currentUser} = useCurrentUser()
  const [operatingSystem, setOperatingSystem] = useState(null)

  useEffect(() => {
    setOperatingSystem(AppManager.GetOS())
  }, [])

  return (
    <>
      <div className="page-container install-app">
        <div id="install-app-wrapper">
          <p className="screen-title">Fastest App Install Possible!</p>
          <p className="screen-intro-text">Quickly install our app, no App Store or Play Store necessary.</p>
          <Spacer height={5} />
          {Manager.IsValid(operatingSystem) && (
            <p className="screen-intro-text">
              The operating system of the device you are currently on appears to be&nbsp;
              <b>{operatingSystem}</b>. Follow the steps below for that operating system.
            </p>
          )}
          <Spacer height={5} />
          {/* IOS */}
          <p className="accordion-header apple">
            iOS <FaApple className={'apple-logo'} />
          </p>
          <div className="os-container apple">
            <div className="flex steps">
              <div className="flex">
                <span className="step-number">1.</span>
                <a href="https://peaceful-coparenting.app" target="_blank" rel="noreferrer">
                  Open our site
                </a>
              </div>
              <div className="flex">
                <span className="step-number">2.</span>
                <p>
                  {DomManager.tapOrClick(true)} the Share button <MdOutlineIosShare /> from the menu bar at the bottom of the screen
                </p>
              </div>

              <div className="flex">
                <span className="step-number">3.</span>
                <p>
                  Scroll and {DomManager.tapOrClick()}
                  <span className="emphasize">Add to Home Screen</span>
                </p>
              </div>

              <div className="flex">
                <span className="step-number">4.</span>
                <p>{DomManager.tapOrClick(true)} the new icon on your Home Screen</p>
              </div>

              <p className="emphasize no-bold more-padding mb-10">
                If you don’t see <b className="accent">Add to Home Screen</b>, you can add it. Scroll down to the bottom of the list,{' '}
                {DomManager.tapOrClick()} &nbsp;
                <b className="accent">Edit Actions</b>, then {DomManager.tapOrClick()} <b className="accent">Add to Home Screen</b>.
              </p>
            </div>
          </div>

          {/* ANDROID */}
          <p className="accordion-header android">
            Android <BsAndroid2 />
          </p>
          <div className="os-container android">
            <div className="flex steps">
              <div className="flex">
                <span className="step-number">1.</span>
                <a href="https://peaceful-coparenting.app" target="_blank" rel="noreferrer">
                  Open our site
                </a>
              </div>
              <div className="flex">
                <span className="step-number">2.</span>
                <p>{DomManager.tapOrClick(true)} the menu icon</p>
              </div>

              <div className="flex">
                <span className="step-number">3.</span>
                <p>
                  {DomManager.tapOrClick(true)} <span className="emphasize">Add to Home Screen</span>
                </p>
              </div>

              <div className="flex">
                <span className="step-number">4.</span>
                <p>Choose a name for the website shortcut</p>
              </div>

              <div className="flex">
                <span className="step-number">5.</span>
                <p>{DomManager.tapOrClick(true)} on the new icon on your Home Screen</p>
              </div>
            </div>
          </div>

          {/* DESKTOP */}
          <p className="accordion-header desktop">
            Windows/Mac <GrPersonalComputer />
          </p>
          <div className="os-container desktop">
            <div className="flex steps">
              <div className="flex">
                <span className="step-number">1.</span>
                <a href="https://peaceful-coparenting.app" target="_blank" rel="noreferrer">
                  Open our site
                </a>
              </div>
              <img src={require('../../img/desktop-installation.png')} alt="" />
              <div className="flex mt-15">
                <span className="step-number">1.</span>
                <p>{DomManager.tapOrClick(true)} the installation button in the address bar</p>
              </div>

              <div className="flex">
                <span className="step-number">2.</span>
                <p>
                  {DomManager.tapOrClick(true)} <span className="emphasize">Install</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {!Manager.IsValid(currentUser) && (
        <button className="button default back-to-login-button" onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
          Back to Login
        </button>
      )}
      {Manager.IsValid(currentUser) && <NavBar navbarClass={'child-info no-Add-new-button'} />}
    </>
  )
}