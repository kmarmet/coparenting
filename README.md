    // "postbuild": "cd public && workbox generateSW",

const install = async () => {
let installPrompt = null;
const installButton = document.querySelector("#install");

    window.addEventListener("beforeinstallprompt", (event) => {
      console.log(event);
      event.preventDefault();
      installPrompt = event;
      installButton.removeAttribute("hidden");
    });
    console.log(installPrompt);
    if (!installPrompt) {
      return;
    }
    const result = await installPrompt.prompt();
    console.log(`Install prompt was: ${result.outcome}`);
    disableInAppInstallPrompt();

    function disableInAppInstallPrompt() {
      installPrompt = null;
      installButton.setAttribute("hidden", "");
    }

};

// doc to image crap
const storage = getStorage();

          // console.log("true");
          const docIndex = images.findIndex((x) => x.includes(".doc"));
          const docPath = images[docIndex];
          const docImage = new Image();
          var urlCreator = window.URL || window.webkitURL;
          // console.log(docPath);
          // console.log(imageUrl);
          const xhr = new XMLHttpRequest();
          xhr.responseType = "blob";
          xhr.open("GET", docPath);
          // console.log("data:image/jpg;base64," + btoa(docPath));
          const decoded = decodeURIComponent(images[docIndex]);
          const substringStart = decoded.lastIndexOf("/");
          const substringEnd = decoded.lastIndexOf("?alt");
          const imageName = decoded.substring(substringStart + 1, substringEnd);
          console.log(decoded);
          fetch(images[docIndex]).then((r) => {
            r.text().then((d) => console.log(d));
          });
          // await FirebaseStorage.getImage(FirebaseStorage.directories.agreements, currentUser.id, imageName).then((img) => {
          //   console.log(img);
          // });

          // https: docImage.src = decoded;
          xhr.onload = async (event) => {
            const blob = xhr.response;
            var reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
              var base64data = reader.result;
              // console.log(base64data);
              // docImage.docImage.src = base64data.replace("data:application/msword;", "");
            };

            // var imageUrl = urlCreator.createObjectURL(blob);
            // console.log(imageUrl);
          };
          xhr.send();
          if (document.querySelector("#img-container")) {
            // console.log("as");
            document.querySelector("#img-container").appendChild(docImage);
          }
          // console.log(docPath);
          images = images.filter((x) => x !== images[docIndex]);

babel rc
// {
// "presets": [
// "@babel/preset-env",
// ["@babel/preset-react", {"runtime": "automatic"}]
// ]
// }
