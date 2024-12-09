import React, { useContext } from 'react'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import ScreenNames from '@screenNames'
import globalState from '../../context'
import { Fade } from 'react-awesome-reveal'

export default function Home() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state

  return (
    <div className="page-container home" id="home-screen-wrapper">
      {/* NAVBAR */}
      <div id="home-navbar" className="flex">
        <img src={require('../../img/logo.png')} alt="Peaceful coParenting" id="logo" />
        <div id="login-buttons">
          <button id="register-button">Sign Up</button>
          <button id="login-button" onClick={() => setState({ ...state, currentScreen: ScreenNames.login })}>
            Log In
          </button>
        </div>
      </div>
      {/* ABOVE FOLD */}
      <div id="above-fold-wrapper">
        <Fade direction={'up'}>
          <div className="section">
            <p id="title">Peaceful Co-Parenting</p>
            <p id="subtitle">Simplifying Communication for Parents, Empowering Kids with Stability</p>
          </div>
        </Fade>
        <div className="flex" id="images">
          <img src={require('../../img/homepage/calendar.png')} alt="" />
          <img src={require('../../img/homepage/memories.png')} alt="" />
          <img src={require('../../img/homepage/childInfo.png')} alt="" />
        </div>
      </div>
      <div className="faded-top"></div>
      <Fade direction={'up'}>
        <div id="below-fold-intro-text" className="section">
          <p>
            Our app provides a stress-free way to manage co-parenting by enhancing communication, scheduling, and decision-making, so{' '}
            <b>you can focus on what matters most, your children's well-being</b>.
          </p>
        </div>
      </Fade>
      {/* BELOW FOLD */}
      <div id="below-fold-wrapper" className="section">
        {/* MAIN CONTENT */}
        <Fade direction={'up'}>
          <div className="flex boxes">
            <div className="text-box">
              <p className="text-box-title"> Streamline your Parenting Schedule </p>
              <p className="text-box-subtitle">Shared Calendars, Real-Time Updates, and Reminders</p>
              <p className="text-box-main-text">
                Easily coordinate visitation, school events, and extracurricular activitess with our intuitive scheduling tool. Ensuring both parents
                stay on the same page without the hassle.
              </p>
            </div>
            <div className="text-box with-bg">
              <p className="text-box-title"> Effective Communication without Conflict </p>
              <p className="text-box-subtitle">Clear Messaging for Healthier Conversations</p>
              <p className="text-box-main-text">
                Facilitate positive communication with in-app messaging designed to reduce misunderstandings. All interactions are organized and
                documented to maintain clarity and peace of mind.
              </p>
            </div>
          </div>
        </Fade>
        <Fade direction={'up'}>
          <div className="full-width-box section">
            <p className="title">Child-Centered Decision Making</p>
            <p className="subtitle">Collaborate on Decisions that Matter Most</p>
            <p className="text">
              From medical appointments to school choices, collaborate effectively through our platform’s decision-making tools, keeping your child’s
              best interests at the forefront.
            </p>
          </div>
        </Fade>
        <Fade direction={'up'}>
          <div id="expenses-wrapper" className="section">
            <div className="text-wrapper">
              <p className="title">Track Expenses and Share Responsibilities</p>
              <p className="subtitle">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                Manage shared expenses like childcare, education, and extracurricular costs with our expense tracking feature, making it easy to split
                costs and avoid conflicts over money.
              </p>
            </div>
            <img src={require('../../img/homepage/expense-tracker.png')} alt="" />
          </div>
        </Fade>

        {/* FOOTER WRAPPER */}
        <div id="footer-wrapper">
          <Fade direction={'up'}>
            <div className="section">
              <p className="title">
                Built for Families, <br /> Focused on Peace
              </p>
              <p className="subtitle">Putting the Well-Being of Children First</p>
              <p>
                Our mission is to provide a supportive space where co-parents can reduce stress and focus on creating a harmonius environment for
                their children. Peaceful co-parenting is just a click away!
              </p>
            </div>
          </Fade>
          <Fade direction={'up'}>
            <img src={require('../../img/homepage/gallery.png')} alt="" />
          </Fade>
          <Fade direction={'up'}>
            <div className="box section">
              <p className="title">Security & Privacy</p>
              <p className="subtitle">Transparency in Shared Financial Responsibilities</p>
              <p className="text">
                <b>Custom Sharing: </b> Keep control over what co-parents see by selecting the "share with" checkbox for events, expenses , and
                important information.
              </p>
              <p className="text">
                <b>Enhanced Protection: </b> Enjoy peace of mind with SMS code verification for password recovery, and secure registration for both
                parents and children.
              </p>
            </div>
          </Fade>
        </div>
        <div className="flex" id="double">
          <Fade direction={'up'}>
            <div className="text-wrapper text-only box">
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
          </Fade>
          <Fade direction={'up'}>
            <div className="text-wrapper text-only with-bg box">
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
          </Fade>
        </div>
      </div>
    </div>
  )
}