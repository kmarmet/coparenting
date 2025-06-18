// hooks/useFirebaseDirectory.js
import {getDownloadURL, getStorage, listAll, ref} from 'firebase/storage'
import {useEffect, useState} from 'react'
import Storage from '../database/storage'
import StringManager from '../managers/stringManager'

const isImage = (name) => {
  return /\.(jpe?g|png|gif|bmp|webp|svg)$/i.test(name)
}

const useAppImages = () => {
  const [appImages, setAppImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const path = Storage.directories.appImages
  const storage = getStorage()

  useEffect(() => {
    let isMounted = true

    const fetchImagesRecursively = async (dirRef, collected = []) => {
      const res = await listAll(dirRef)

      // Get image URLs in this folder
      const filePromises = res.items.filter((item) => isImage(item.name)).map((itemRef) => getDownloadURL(itemRef))

      const urls = await Promise.all(filePromises)
      let mappedImages = []
      for (let url of urls) {
        mappedImages.push({
          name: StringManager.removeFileExtension(Storage.GetImageNameFromUrl(url)),
          url: url,
        })
      }

      collected.push(...mappedImages)

      // Recurse into subdirectories
      for (const folderRef of res.prefixes) {
        await fetchImagesRecursively(folderRef, collected)
      }

      return collected
    }

    const fetchAllImages = async () => {
      try {
        const rootRef = ref(storage, path)
        const allImages = await fetchImagesRecursively(rootRef)
        if (isMounted) {
          setAppImages(allImages)
        }
      } catch (error) {
        console.error('Error fetching images:', error)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchAllImages().then((r) => r)

    return () => {
      isMounted = false
    }
  }, [path, storage])

  return {appImages, loading, error}
}

export default useAppImages