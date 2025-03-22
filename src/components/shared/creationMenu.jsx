import React, { useContext } from 'react'
import ScreenActions from './screenActions'
import { IoIosArrowDown } from 'react-icons/io'
import { FaCameraRotate, FaWandMagicSparkles } from 'react-icons/fa6'
import { Fade } from 'react-awesome-reveal'
import globalState from '../../context'
const CreationMenu = () => {
  const { state, setState } = useContext(globalState)
  const { currentUser, theme, activeInfoChild } = state
  return (
    <ScreenActions>
      <div className="action-items">
        <Fade direction={'right'} className={'child-info-fade-wrapper'} duration={500} triggerOnce={false} cascade={true}>
          {/* CUSTOM INFO */}
          <div
            className="action-item"
            onClick={() => {
              setState({ ...state, showBottomMenu: false })
            }}>
            <div className="content">
              <div className="svg-wrapper">
                <FaWandMagicSparkles className={'magic'} />
              </div>
              <p>
                Add your Own Info<span className="subtitle">Include personalized details about your child</span>
              </p>
            </div>
          </div>
          <IoIosArrowDown className={'close-arrow'} onClick={() => setState({ ...state, showBottomMenu: false })} />
        </Fade>
      </div>
    </ScreenActions>
  )
}

export default CreationMenu