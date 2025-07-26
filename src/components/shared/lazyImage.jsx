import React, {useEffect, useState} from "react"
import {InView} from "react-intersection-observer"
import AppImages from "../../constants/appImages"
import Manager from "../../managers/manager"

const LazyImage = ({imgName, alt, classes = "", onClick = () => {}}) => {
      const [isInViewport, setIsInViewport] = useState(false)
      const [src, setSrc] = useState("")

      const GetUrlByName = async () => {
            const url = await AppImages.GetUrlFromName(imgName)
            setSrc(url)

            return ""
      }

      useEffect(() => {
            if (Manager.IsValid(imgName, true)) {
                  GetUrlByName()
            }
      }, [imgName])

      return (
            <>
                  {!Manager.IsValid(src, true) && !isInViewport && <div className={"skeleton"}></div>}
                  <InView
                        className={`lazy-image${classes ? " " + classes : ""}`}
                        onChange={(inView, entry) => {
                              if (inView) {
                                    setIsInViewport(true)
                              }
                        }}>
                        <img className={`${classes}`} src={Manager.IsValid(src, true) ? src : ""} alt={alt} onClick={onClick} />
                  </InView>
            </>
      )
}
export default LazyImage