import React from 'react'
import {FaDirections} from 'react-icons/fa'
import {HiPhoneArrowUpRight} from 'react-icons/hi2'
import {MdWebAsset} from 'react-icons/md'
import DomManager from '../../managers/domManager'
import Manager from '../../managers/manager'
import StringManager from '../../managers/stringManager'
import Spacer from './spacer'

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
      {Manager.IsValid(valueToValidate?.toString()) && (
        <div style={DomManager.AnimateDelayStyle(1, 0.009)} className={`block ${classes} ${isFullWidth ? 'w-100 full-width' : ''}`}>
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
                    <MdWebAsset className={'website'} />
                  </a>
                  <Spacer height={2} />
                </>
              )}

              {/*  NAV LINK */}
              {isNavLink && !isLink && (
                <>
                  <a href={Manager.GetDirectionsLink(linkUrl)} target="_blank" className={'block-text nav-link'} rel="noreferrer">
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