// Path: src\components\screens\home.jsx
import React, { useContext, useEffect, useState } from 'react'
import globalState from '../../context'
import { Fade } from 'react-awesome-reveal'
import { PiCalendarDotsDuotone, PiMoneyWavyDuotone } from 'react-icons/pi'
import { AiTwotoneMessage, AiTwotoneSafetyCertificate, AiTwotoneTool } from 'react-icons/ai'
import DomManager from '/src/managers/domManager'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import firebaseConfig from '/src/firebaseConfig'
import { initializeApp } from 'firebase/app'
import { TbSunMoon } from 'react-icons/tb'
import Logo from '../../img/logo.png'
import { MdOutlineStar } from 'react-icons/md'
import { FaRegHandshake } from 'react-icons/fa'
import { useLongPress } from 'use-long-press'
import ScreenNames from '/src/constants/screenNames'
import Manager from '/src/managers/manager'
import LightGallery from 'lightgallery/react'
import 'lightgallery/css/lightgallery.css'
import AppManager from '/src/managers/appManager.js'
import HomescreenSections from '/src/models/homescreenSections.js'
import { IoIosArrowUp, IoIosArrowDown } from 'react-icons/io'
import { LazyLoadImage } from 'react-lazy-load-image-component'
import { TbArrowBadgeRight } from 'react-icons/tb'

export default function Home() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  const bind = useLongPress((element) => {
    setState({ ...state, currentScreen: ScreenNames.login })
  })
  // Init Firebase
  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)

  const toggleFeature = (feature) => {
    const featureName = feature.currentTarget.dataset.name
    const clickedFeatureElement = document.querySelector(`[data-name='${featureName}']`)
    const allFeatureElements = document.querySelectorAll(`[data-name]`)

    if (clickedFeatureElement) {
      if (Manager.contains(clickedFeatureElement.classList, 'active')) {
        clickedFeatureElement.classList.remove('active')
      } else {
        if (Manager.isValid(allFeatureElements)) {
          for (let _feature of allFeatureElements) {
            _feature.classList.remove('active')
          }
        }
        clickedFeatureElement.classList.add('active')
      }
    }
  }

  const handleScroll = () => {
    const firstViewableBox = document.querySelector('#first-scroll-button-candidate')
    const scrollWrapper = document.querySelector('#wrapper')
    const scrollToTopButton = document.querySelector('#scroll-to-top-button-wrapper')
    if (DomManager.mostIsInViewport(scrollWrapper, firstViewableBox)) {
      scrollToTopButton.classList.remove('hide')
    } else {
      scrollToTopButton.classList.add('hide')
    }
  }

  const scrollToTop = () => {
    const scrollToTopButton = document.querySelector('#scroll-to-top-button-wrapper')
    scrollToTopButton.classList.remove('hide')

    const header = document.getElementById('home-navbar')
    header.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const scrollDownButton = document.querySelector('#scroll-down-button-wrapper')
    const scrollWrapper = document.querySelector('#wrapper')

    if (scrollDownButton) {
      scrollDownButton.addEventListener('click', () => {
        scrollWrapper.scrollBy({
          top: screen.height - 100,
          left: 0,
          behavior: 'smooth',
        })
      })
    }
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // console.log(user)
        // User is signed in.
        // setState({ ...state, isLoading: true })
      } else {
        // No user is signed in.
        setState({ ...state, isLoading: false })
      }
    })

    const queryStringSection = AppManager.getQueryStringParams('section')
    if (Manager.isValid(queryStringSection)) {
      const whyUsSection = document.querySelector('.unique-features.section')
      if (queryStringSection === HomescreenSections.whyUs) {
        if (whyUsSection) {
          whyUsSection.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }

    const appWrapper = document.getElementById('app-content-with-sidebar')
    if (appWrapper) {
      appWrapper.classList.add('home')
    }
  }, [])

  return (
    <div id="wrapper" onScroll={handleScroll}>
      {/* ABOVE FOLD WRAPPER */}
      <div id="scroll-to-top-button-wrapper" className="hide" onClick={scrollToTop}>
        <IoIosArrowUp id={'scroll-to-top-button'} />
      </div>
      <div id="scroll-down-button-wrapper">
        <IoIosArrowDown id={'scroll-down-button'} />
      </div>
      <div id="above-fold-wrapper" className="section above-fold">
        <Fade>
          <div id="home-navbar" className="flex">
            <img src={Logo} id="logo" {...bind()} alt="Logo" />
            <div id="login-buttons">
              {/*<button id="register-button" onClick={() => setState({ ...state, currentScreen: ScreenNames.registration })}>*/}
              {/*  Sign Up <IoPersonAddOutline />*/}
              {/*</button>*/}
              {/*<button id="login-button" className="default default button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>*/}
              {/*  Log In <AiTwotoneUnlock />*/}
              {/*</button>*/}
              {/*<button id="login-button" className="default default button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>*/}
              {/*  Get Started*/}
              {/*</button>*/}
              <div id="choose-peace-text" className="flex">
                <p id="choose-peace-text">
                  <b>Choose Peace</b>
                  <span>ful Co-Parenting</span>
                </p>
              </div>
            </div>
          </div>
          <div className="section page-title">
            <p id="title">Peaceful {DomManager.isMobile() ? <br /> : ''} Co-Parenting</p>
            <p id="subtitle">
              Built for Families {DomManager.isMobile() ? '' : '-'} {DomManager.isMobile() ? <br /> : ''} Focused on Peace
            </p>
          </div>
          <LightGallery elementClassNames={`light-gallery ${theme}`} speed={500} selector={'.image'}>
            <div className="flex" id="images">
              <img className={'image'} src={require('/src/img/homepage/memories.png')} alt="Menu" />
              <img className={'image'} src={require('/src/img/homepage/calendar.png')} alt="Calendar" />
              <img className={'image'} src={require('/src/img/homepage/childInfo.png')} alt="Child Info" />
            </div>
          </LightGallery>
        </Fade>
      </div>

      {/* PAGE CONTAINER */}
      <div id="below-fold-intro-text" className="section">
        <p>
          Our app provides a stress-free way to manage co-parenting by enhancing communication, scheduling, and decision-making, so&nbsp;
          <b>you can focus on what matters most, your children&#39;s well-being</b>.
        </p>
      </div>
      {/* BELOW FOLD */}
      <div id="below-fold-wrapper">
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="flex boxes section" data-section={1}>
            <div className="text-box">
              <PiCalendarDotsDuotone />
              <p className="text-box-title">Streamline your Parenting Schedule </p>
              <p className="text-box-subtitle">Shared Calendars, Real-Time Updates, and Reminders</p>
              <p className="text-box-main-text">
                Easily coordinate visitation, school events, and extracurricular activities with our intuitive scheduling tool. Ensuring both parents
                stay on the same page without the hassle.
              </p>
            </div>
            <div className="text-box with-bg" id="first-scroll-button-candidate">
              <AiTwotoneMessage />
              <p className="text-box-title"> Effective Communication without Conflict </p>
              <p className="text-box-subtitle">Clear Messaging for Healthier Conversations</p>
              <p className="text-box-main-text">
                Facilitate positive communication with in-app messaging designed to reduce misunderstandings. All interactions are organized and
                documented to maintain clarity and peace of mind.
              </p>
            </div>
          </div>
        </Fade>

        {/* UNIQUE FEATURES */}
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="section full-width-box unique-features" data-section={2}>
            <div id="text-content">
              <p className="title">
                Why <span>Choose</span> <span>Peace</span>ful Co-Parenting?
              </p>
              <p className="text subtitle">
                Peaceful Co-Parenting offers the same abilities and features as other applications, yet it stands out with its{' '}
                <b>DISTINCTIVE FEATURES</b>. These exclusive features are UNAVAILABLE in any other co-parenting application.
              </p>
              <span className="feature-toggle-instructions">{DomManager.tapOrClick(true)} any feature to view or hide details</span>
            </div>

            <div className="flex" id="feature-grid">
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'any-device'}>
                <p className="feature-title">
                  Available on&nbsp;<b>Any</b>&nbsp;Device
                </p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">
                  Unlike other co-parenting applications that require installation through an app store, which limits them to specific devices and
                  operating systems (such as Apple and Android), Peaceful Co-Parenting offers a more flexible solution.
                </p>
                <p className="feature-subtitle">
                  You can install our application on <b>any device</b>—be it a phone, tablet, or computer—and it is compatible with all operating
                  systems, including Android and Apple.
                </p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      <TbArrowBadgeRight /> Simple (2-step) Installation
                      <ul>
                        <li>You do not have to us an app store to install the application</li>
                        <li>
                          Installation Steps
                          <ul>
                            <li>Visit the website</li>
                            <li>Click the share button</li>
                            <li>
                              Click <i>Add to Homescreen</i>
                            </li>
                          </ul>
                        </li>
                        <li>These steps are provided for Android, iOS (Apple) and Laptop/Desktop computers</li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Device Support
                      <ul>
                        <li>
                          You can install our application on any device, including phones, tablets, and computers, without the need for an app store
                        </li>
                        <li>All of your activities and data will be synchronized across all devices if you utilize multiple devices</li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Operating System Support
                      <ul>
                        <li>You can install our application on any device, whether it is a Windows, Mac, Android, or Apple device</li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Updates
                      <ul>
                        <li>
                          All updates, including feature enhancements and bug fixes, are performed automatically in the background, requiring no
                          action on your part
                        </li>
                        <li>Each time you launch the application, it will be completely up to date</li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'one-subscription'}>
                <p className="feature-title">One Subscription = ALL Features</p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">
                  Many co-parenting apps offer various pricing tiers. You receive basic features at one price, but they often upsell for access to
                  more valuable/useful features. That&#39;s not the case with us!
                </p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      Fair Pricing that Everyone can Afford
                      <ul>
                        <li>
                          <b>Only $4.99 per month!</b>
                        </li>
                        <li>
                          For example: The OurFamilyWizard application costs $150 per year - <b>PER co-parent/user!</b>
                          <ul>
                            <li>
                              The annual cost of Peaceful Co-Parenting is significantly reduced, being <b>85% less expensive</b>!
                            </li>
                            <li>
                              $120 for <b>BOTH co-parents</b> instead of $300
                              <ul>
                                <li>
                                  You and your co-parent can take advantage of our application and all its features for{' '}
                                  <b>less than half the price of a single OurFamilyWizard subscription</b>
                                </li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Access to ALL Features - ZERO Upselling
                      <ul>
                        <li>
                          Too often subscriptions (such as OurFamilyWizard) have several pricing tiers. Basic, Premium, Max, .etc.
                          <ul>
                            <li>That is NOT keeping you in mind</li>
                            <ul>
                              <li>You should have the opportunity to enjoy all the features at a price that is very budget-friendly</li>
                            </ul>
                          </ul>
                        </li>
                        <li>
                          For the price of a cup of coffee ($4.99) you get <b>ALL</b> features
                          <ul>
                            <li>
                              It&#39;s essential for every co-parent to have access to the full range of resources and tools that our application
                              offers
                            </li>
                            <li>
                              We aim to simplify and bring harmony to your co-parenting experience, which is why we don’t impose extra fees for
                              accessing essential features
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'ui'}>
                <p className="feature-title">Designed with You in Mind</p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">
                  Numerous applications can often be quite challenging to navigate. Picture this: you need to log an expense to share with your
                  co-parent, but you're unable to locate the option to do so.
                </p>
                <p className="feature-subtitle">
                  We aim to <b>remove that frustration</b> and save you time, allowing you to focus on what truly matters.
                </p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      Menu
                      <ul>
                        <li>
                          The main menu includes large, clickable menu items
                          <ul>
                            <li>These menu items each have a name that easily conveys where you go when you click it</li>
                            <li>Each item also includes an icon to associate with the text quickly</li>
                          </ul>
                        </li>
                        <li>The design facilitates quick and effortless navigation to your desired destination or task</li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Straightforward Pages (e.g Expense Tracker, Memories, .etc)
                      <ul>
                        <li>Each page features a header that clearly states its intended purpose</li>
                        <li>
                          You will find that any potential questions are usually accompanied by supportive text and visual aids to enhance
                          understanding{' '}
                          <ul>
                            <li>
                              Viewing the Calendar, for example
                              <ul>
                                <li>Each day with scheduled events is marked by color-coordinated dots</li>
                                <li>The calendar is accompanied by a legend that indicates the meaning of each dot&#39;s color</li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'realtime'}>
                <p className="feature-title">Realtime Engagement</p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">
                  You will receive all updates, changes, and notifications <b>instantly</b>, whether the application is open or closed.
                </p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      Notifications
                      <ul>
                        <li>
                          Whenever a co-parent schedules a calendar event, shares a medical record, or sends you a message, you will receive an
                          instant notification
                        </li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Application, Activity & Data
                      <ul>
                        <li>
                          If you make an update (add a child, update a calendar event, .etc) you will see the updates <b>automatically</b>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'multiple-coparents'}>
                <p className="feature-title">Multiple Co-Parent Support</p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">
                  We recognize that you or your spouse might have several co-parents from previous relationships or marriages. We have acknowledged
                  this situation and offer support tailored to this dynamic.
                </p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      Multiple Co-Parents
                      <ul>
                        <li>Add as many co-parents as you need to</li>
                        <li>Easily utilize all of our application&#39;s features for each co-parent</li>
                        <li>
                          You have the option to share important information either with individual co-parents or with all of them simultaneously
                        </li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Children from More than One Parent
                      <ul>
                        <li>
                          You have the capability to include an unlimited number of children for the purpose of storing information or sharing updates
                        </li>
                        <li>
                          Any child (with a valid phone number) can create an account and also use our application
                          <ul>
                            <li>
                              If your child has their own account, they will be able to access features such as the calendar, ensuring they stay
                              informed
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'messaging'}>
                <p className="feature-title">Messaging/Communication</p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">Other applications might offer messaging capabilities, but they lack these specific features</p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      Pause/Resume Conversations
                      <ul>
                        <li>You can pause a conversation and its notifications at any moment, and later resume it whenever you choose.</li>
                        <li>
                          Search
                          <ul>
                            <li>
                              Enter more than three characters to view all messages sent or received, including the specific text you are looking for
                            </li>
                          </ul>
                        </li>
                        <li>
                          Bookmarking
                          <ul>
                            <li>
                              Bookmark any message at any time
                              <ul>
                                <li>You can access all your bookmarks (saved messages) instantly with a single click of a button</li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                        <li>
                          Message Copying
                          <ul>
                            <li>Long-press any message to copy it so you can paste it anywhere you would like</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="feature" onClick={(e) => toggleFeature(e)} data-name={'support'}>
                <p className="feature-title">Support Team that Caters to You</p>
                <MdOutlineStar className={'star'} />
                <p className="feature-subtitle">
                  It&#39;s frustrating when you contact customer support and have to wait days for a response, only to receive a generic answer that
                  feels like it was sent to countless others.
                </p>

                <p className="feature-subtitle">
                  We understand how important your time is, and that&#39;s why <b>we prioritize you!</b>
                </p>
                <div className="content">
                  <ul>
                    <li className="list-title">
                      Lightning Fast Response Time
                      <ul>
                        <li>
                          You will have a reply from our response team <b>within hours</b>, not days
                        </li>
                        <li>
                          This includes
                          <ul>
                            <li>Technical issues encountered in the app</li>
                            <li>Feature requests</li>
                            <li>App feedback</li>
                            <li>Anything else you would like to contact us about</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li className="list-title">
                      No hidden or extra cost for support
                      <ul>
                        <li>All support requests and feature addition requests are included in your subscription</li>
                      </ul>
                    </li>
                    <li className="list-title">
                      No Middleman
                      <ul>
                        <li>
                          When you reach out to us for support, your request/concern will go <b>directly</b> to the technical/development team that
                          will be working on handling the issue
                          <ul>
                            <li>Eliminates any unnecessary wait time for your concern/request</li>
                            <li>
                              The technical team will be making the changes to resolve issues or add feature requests - so it makes sense to be able
                              to engage with them directly
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Feature Requests
                      <ul>
                        <li>
                          If you would like to have a feature added to our app, let us know!
                          <ul>
                            <li>
                              We are more than happy to consider <b>all</b> feature requests
                              <ul>
                                <li>The goal is provide an all-in-one application that fits your needs exactly</li>
                              </ul>
                            </li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                    <li className="list-title">
                      Authentic Support from Real People
                      <ul>
                        <li>
                          We promise to provide help that is 100% related to the concern/request you send us
                          <ul>
                            <li>No bots</li>
                            <li>No &#39;canned&#39; responses</li>
                            <li>No vague responses that do not directly address your concern</li>
                          </ul>
                        </li>
                      </ul>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Fade>

        {/* EXPENSES */}
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div id="expenses-wrapper" className="section expenses">
            <PiMoneyWavyDuotone />
            <div className="text-wrapper">
              <p className="title">Track Expenses and Share Responsibilities</p>
              <p className="text subtitle">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                Manage shared expenses like childcare, education, and extracurricular costs with our expense tracking feature, making it easy to split
                costs and avoid conflicts over money.
              </p>
            </div>
            <LazyLoadImage src={require('/src/img/homepage/expense-tracker.png')} alt="Menu" effect="blur" delay={1000} />
          </div>
        </Fade>

        {/* COLLABORATION */}
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div id="collaboration" className="section text-box flex">
            <FaRegHandshake />
            <div className="text-wrapper">
              <p className="title">Collaborate on Decisions that Matter Most</p>
              <p className="text">
                From medical appointments to school choices, collaborate effectively through our platform’s decision-making tools, keeping your
                child’s best interests at the forefront.
              </p>
              <p className="text">
                Co-parenting peacefully requires a lot of tools and resources. With that in mind, everything you need can be found in our menu - no
                time spent looking for anything!
              </p>
              <p className="text">
                Our mission is to provide a supportive space where you and your co-parent can reduce stress and focus on creating a harmonious
                environment for your children.
              </p>
            </div>
            <LazyLoadImage src={require('/src/img/homepage/menu.png')} alt="Menu" effect="blur" delay={1000} />
          </div>
        </Fade>

        {/* SECURITY & PRIVACY */}
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="box section security-and-privacy with-bg">
            <AiTwotoneSafetyCertificate />
            <div className="content text-wrapper">
              <p className="title">Security & Privacy</p>
              <p className="text subtitle center">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                <b>Custom Sharing: </b> Keep control over what co-parents see by selecting the "share with" checkbox for events, expenses , and
                important information.
              </p>
              <p className="text">
                <b>Enhanced Protection: </b> Enjoy peace of mind with SMS code verification for password recovery, and secure registration for both
                parents and children.
              </p>
            </div>
          </div>
        </Fade>

        {/* COMPATIBLE */}
        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="section text-box all-devices" id="all-devices">
            <TbSunMoon />
            <p className="title">Compatible & Accessible</p>
            <div className=" text">
              <p className="subtitle">
                <b>Available on All Devices </b>
              </p>
              <span>iOS, Android, Windows, Mac, .etc.</span>
            </div>
            <div className="text">
              <p className="subtitle">
                <b>Available on All Screen Sizes </b>
              </p>
              <span>Adapts to any screen size (phone, tablet, laptop, .etc) and/or screen orientation.</span>
            </div>
            <div className="text">
              <p className="subtitle">
                <b>Supports both Light & Dark Modes </b>
              </p>
              <span>
                We understand that visual impairments and glare from lighting can be challenging. That&#39;s why our application offers both Light and
                Dark modes, easily switchable with just a {DomManager.tapOrClick()}. We&#39;re here to ensure your experience is comfortable and
                accessible!
              </span>
            </div>

            <div className="flex images mt-15">
              <LazyLoadImage src={require('/src/img/homepage/devices/phone.png')} alt="Menu" effect="blur" delay={1000} />

              <LazyLoadImage src={require('/src/img/homepage/devices/laptop.png')} alt="Menu" effect="blur" delay={1000} />

              <LazyLoadImage src={require('/src/img/homepage/devices/tablet.png')} alt="Menu" effect="blur" delay={1000} />
            </div>

            <p className="subtitle mt-25 mb-0" id="multiple-device-usage">
              You can use the application across multiple devices and all of your data will be kept in sync across them all!
            </p>
          </div>
        </Fade>

        <Fade direction={'up'} duration={1000} triggerOnce={true}>
          <div className="flex" id="double">
            <div className="text-wrapper text-only box">
              <AiTwotoneTool />
              <p className="title">Flexible Co-Parenting Tools</p>
              <p className="text">
                <b>Swap Requests:</b> Need a schedule change? Easily request new times or locations for child transfers with just a few clicks.
              </p>
              <p className="text">
                <b>Shared Calendar:</b> Seamlessly plan and manage visitations, holidays, and paydays with icons, search functionality, and automatic
                reminders.
              </p>
              <p className="text">
                <b>Expense Tracker:</b> Stay on top of shared costs by uploading receipts, tracking expenses with live due date countdowns, and
                sending reminders to the responsible co-parent.
              </p>
            </div>
            <div className="text-wrapper text-only  box">
              <AiTwotoneMessage />
              <p className="title">Streamlined Communication</p>
              <p className="text">
                <b>Easy Messaging: </b> Keep conversations organized with features like message archiving, bookmarking, and a powerful search tool for
                quick access to important chats.
              </p>
              <p className="text">
                <b>Multimedia Sharing</b> Share memories in real-time by uploading photos and milestones with your co-parent, helping you both stay
                connected with your child's journey.
              </p>
            </div>
          </div>
        </Fade>
      </div>
    </div>
  )
}