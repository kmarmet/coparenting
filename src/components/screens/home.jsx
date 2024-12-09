import React, { useContext } from 'react'
import { contains, formatNameFirstNameOnly } from '../../globalFunctions'
import ScreenNames from '@screenNames'
import globalState from '../../context'

export default function Home() {
  const { state, setState } = useContext(globalState)
  const { theme, currentUser } = state
  return (
    <div className="page-container home">
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
        <p id="title">Peaceful Co-Parenting</p>
        <p id="subtitle">Simplifying Communication for Parents, Empowering Kids with Stability</p>
        <div className="flex" id="images">
          <img src={require('../../img/homepage/calendar.png')} alt="" />
          <img src={require('../../img/homepage/memories.png')} alt="" />
          <img src={require('../../img/homepage/childInfo.png')} alt="" />
        </div>
      </div>
      <div className="faded-top"></div>
      {/* BELOW FOLD */}
      <div id="below-fold-wrapper">
        <p id="below-fold-intro-text">
          Our app provides a stress-free way to manage co-parenting by enhancing communication, scheduling, and decision-making, so{' '}
          <b>you can focus on what matters most, your children's well-being</b>.
        </p>

        {/* MAIN CONTENT */}
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
        <div className="full-width-box">
          <p className="title">Child-Centered Decision Making</p>
          <p className="subtitle">Collaborate on Decisions that Matter Most</p>
          <p className="text">
            From medical appointments to school choices, collaborate effectively through our platform’s decision-making tools, keeping your child’s
            best interests at the forefront.
          </p>
        </div>
        <div id="expenses-wrapper">
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
        <div id="footer-wrapper" className="flex">
          <img src={require('../../img/homepage/three-images.png')} alt="" />
          <div className="text-wrapper">
            <p className="title">
              Built for Families, <br /> Focused on Peace
            </p>
            <p className="subtitle">Putting the Well-Being of Children First</p>
            <p>
              Our mission is to provide a supportive space where co-parents can reduce stress and focus on creating a harmonius environment for their
              children. Peaceful co-parenting is just a click away!
            </p>
            <div className="box">
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
          </div>
        </div>
      </div>
    </div>
  )
}