import React from 'react'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import {FaDirections} from 'react-icons/fa'
import Spacer from './spacer'
import {HiPhoneArrowUpRight} from 'react-icons/hi2'
import {IoOpen} from 'react-icons/io5'

const DetailBlock = ({
  text,
  title,
  valueToValidate,
  classes = '',
  isFullWidth = false,
  isLink = false,
  isPhone = false,
  linkUrl = '',
  isNavLink = false,
  children,
  isCustom = false,
}) => {
  return (
    <>
      {Manager.isValid(valueToValidate?.toString()) && (
        <div className={`block ${classes} ${isFullWidth ? 'w-100 full-width' : ''}`}>
          {/* CUSTOM */}

          {isCustom && children}

          {/* STANDARD */}
          {!isCustom && (
            <>
              {/* TEXT */}
              {!isLink && !isPhone && !isNavLink && (
                <p className={StringManager.GetWordCount(text) < 10 ? 'block-text center' : 'block-text'}>{text}</p>
              )}

              {/*  LINK */}
              {isLink && (
                <>
                  <a href={linkUrl} target="_blank" className={'block-text website'} rel="noreferrer">
                    <IoOpen className={'website'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}

              {/*  NAV LINK */}
              {isNavLink && !isLink && (
                <>
                  <a href={Manager.getDirectionsLink(linkUrl)} target="_blank" className={'block-text nav-link'} rel="noreferrer">
                    <FaDirections className={'nav-link'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}

              {/*  PHONE */}
              {isPhone && (
                <>
                  <a href={`tel:${text}`} target="_blank" className={'block-text phone'} rel="noreferrer">
                    <HiPhoneArrowUpRight className={'phone'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}
            </>
          )}

          {/* TITLE */}
          <p className="block-title">{title}</p>
        </div>
      )}
    </>
  )
}

export default DetailBlock