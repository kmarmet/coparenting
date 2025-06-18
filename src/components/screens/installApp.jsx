// Path: src\components\screens\installApp.jsx
import React, {useContext, useEffect, useState} from 'react'
import {BsAndroid2} from 'react-icons/bs'
import {FaApple} from 'react-icons/fa6'
import {GrPersonalComputer} from 'react-icons/gr'
import {MdOutlineIosShare} from 'react-icons/md'
import AppImages from '../../constants/appImages'
import ScreenNames from '../../constants/screenNames'
import globalState from '../../context'
import AppManager from '../../managers/appManager'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import NavBar from '../navBar'
import LazyImage from '../shared/lazyImage'
import ScreenHeader from '../shared/screenHeader'
import Spacer from '../shared/spacer'

export default function InstallApp() {
  const {state, setState} = useContext(globalState)
  const {authUser} = state
  const [operatingSystem, setOperatingSystem] = useState(null)
  const [showComputerInstallSlideshow, setShowComputerInstallSlideshow] = useState(false)
  useEffect(() => {
    setOperatingSystem(AppManager.GetOS())
  }, [])

  return (
    <>
      {/*  DESKTOP INSTALLATION SLIDESHOW */}
      {/*<Slideshow*/}
      {/*  activeIndex={0}*/}
      {/*  show={showComputerInstallSlideshow}*/}
      {/*  hide={() => setShowComputerInstallSlideshow(false)}*/}
      {/*  images={[*/}
      {/*    new SlideshowImage({*/}
      {/*      classes: 'computer-installation',*/}
      {/*      url: '../../img/computer-installation.png',*/}
      {/*      title: 'Computer Installation',*/}
      {/*      notes: 'Easily install via any web browser on your computer',*/}
      {/*    }),*/}
      {/*  ]}*/}
      {/*/>*/}
      <div className="page-container install-app">
        <div id="install-app-wrapper">
          <ScreenHeader
            title={'Install in 10 Seconds <br/> ...or Less'}
            screenDescription="Quickly install - no App Store or Play Store necessary!"
          />
          <Spacer height={10} />

          <div className="screen-content">
            <img src={require('../../img/logo.png')} alt="" />
            {Manager.IsValid(operatingSystem) && (
              <p className="screen-intro-text">
                The operating system of the device you are currently on appears to be&nbsp;
                <b>{operatingSystem}</b>. Follow the steps below for that operating system.
              </p>
            )}
            <Spacer height={10} />
            {/* IOS */}
            <div className="os-container apple">
              <p className="accordion-header apple">
                iOS <FaApple className={'logo'} />
              </p>
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
                    Scroll and {DomManager.tapOrClick()}&nbsp;
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

            <Spacer height={5} />
            {/* ANDROID */}
            <div className="os-container android">
              <p className="accordion-header android">
                Android <BsAndroid2 className={'logo'} />
              </p>
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
            <Spacer height={5} />
            {/* DESKTOP */}
            <div className="os-container desktop">
              <p className="accordion-header desktop">
                Windows/Mac <GrPersonalComputer className={'logo'} />
              </p>
              <div className="flex steps">
                <div className="flex">
                  <span className="step-number">1.</span>
                  <a href="https://peaceful-coparenting.app" target="_blank" rel="noreferrer">
                    Open our site
                  </a>
                </div>
                <div className="flex">
                  <span className="step-number">2.</span>
                  <p>{DomManager.tapOrClick(true)} the installation button in the address bar</p>
                </div>

                <LazyImage
                  imgName={AppImages.misc.desktopInstallation.name}
                  alt={'Desktop Installation'}
                  classes="installation computer-installation"
                  onClick={() => setShowComputerInstallSlideshow(true)}
                />
                <div className="flex">
                  <span className="step-number">3.</span>
                  <p>
                    {DomManager.tapOrClick(true)} <span className="emphasize">Install</span>
                  </p>
                </div>
              </div>
            </div>
            <Spacer height={10} />
            {!Manager.IsValid(authUser) && (
              <button className="button default back-to-login-button" onClick={() => setState({...state, currentScreen: ScreenNames.login})}>
                Back to Login
              </button>
            )}
            {Manager.IsValid(authUser) && <NavBar navbarClass={'child-info no-Add-new-button'} />}
          </div>
        </div>
      </div>
    </>
  )
}