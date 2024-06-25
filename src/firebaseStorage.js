import { getStorage, ref, getDownloadURL, listAll, uploadBytes, uploadBytesResumable, put, firebase } from "firebase/storage";

const FirebaseStorage = {
  directories: {
    expenseImages: "expense-images",
    agreements: "agreements",
  },
  getImage: async (imageDir, id, domImg) => {
    const storage = getStorage();

    await getDownloadURL(ref(storage, `${imageDir}/${id}`))
      .then((url) => {
        var image = new Image();
        image.src = url;
        image.onload = function () {
          domImg.setAttribute("src", url);
        };
      })
      .catch(() => {
        domImg.setAttribute("src", require("./img/fallback-image.png"));
      });
  },
  getImages: async (imageDir, id) => {
    const storage = getStorage();
    let images = [];
    await listAll(ref(storage, `${imageDir}/${id}`)).then((res) => {
      images = res.items.map((imageRef) => getDownloadURL(imageRef));
    });

    return images;
  },
  imageToBlob: async (img) => {
    const fr = new FileReader();
    const blob = new Blob([img], { type: "text/plain" });

    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  },
  upload: (imgDirectory, id, img) => {
    const storage = getStorage();
    const storageRef = ref(storage, `${imgDirectory}/${id}`);
    uploadBytes(storageRef, img);
  },
  uploadMultiple: async (imgDirectory, id, images) => {
    const storage = getStorage();

    for (let i = 0; i < images.length; i++) {
      const storageRef = ref(storage, `${imgDirectory}/${id}/${images[i].name}`);
      console.log(`${imgDirectory}/${id}/${images[i].name}`);
      await uploadBytes(storageRef, images[i])
        .then(() => {
          console.log("success", i);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  },
  delete: async (imgDirectory, uid) => {
    const storage = getStorage();
    const bin = storageRef(storage, `${imgDirectory}/${uid}`);
    // Delete the file
    deleteObject(bin)
      .then(() => {
        // File deleted successfully
      })
      .catch((error) => {
        console.log(error);
        // Uh-oh, an error occurred!
      });
  },
};

export default FirebaseStorage;
