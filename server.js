const express = require('express')
const app = express()
const path = require('path')
const imgur = require('imgur')
const fileUpload = require('express-fileupload')
const fs = require('fs')
const firebase = require('firebase')
const PORT = process.env.PORT || 3000

firebase.initializeApp({
    databaseURL: 'https://image-uploader-72ff0.firebaseio.com'
})

imgur.setCredentials('watumullsystem@gmail.com', `8lkK3y"b8Jjh3)d`, '1f1a3b52579fb64')

const ref = firebase.database().ref('/')

app.use(express.static(path.resolve(__dirname,'public')))
app.use(fileUpload())

app.get('/',(req,res) => {
	res.sendFile(path.resolve(__dirname,'index.html'))
})

app.get('/firebaseImages',(req,res) => {
	let msg = []
	ref.once("value", function(snapshot) {
	  snapshot.forEach(function(child) {
	    msg.push(child.val())
	  })
		res.json({msg})
	})
})

const deleteContentsInsideTempImgDirectory = () => {
	const dirPath = 'public/temp/'
      let files
      try { files = fs.readdirSync(dirPath) }
      catch(e) { return }
      if (files.length > 0)
        for (let i = 0; i < files.length; i++) {
          let filePath = dirPath + '/' + files[i]
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath)
          else
            deleteContentsInsideTempImgDirectory(filePath)
        }
}

const uploadImageToImgur = (imgTempPath) => {
	imgur.uploadFile(imgTempPath)
	  .then(function (json) {
	  	  const temp = json.data.link.split(":")
	  	  const https = temp[0] + "s:" + temp[1]
	      ref.push(https)
	      deleteContentsInsideTempImgDirectory()
	      console.log(`Deleting 'temp' directory`);
	  })
	  .catch(function (err) {
	      console.error(err.message)
	  })
}


app.post('/upload', (req, res) => {
  	const dir = 'public/temp'
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir)
  }
  if (!req.files)
    return res.status(400).send('No files were uploaded.')
  let sampleFile = req.files["uploads[]"]
	if(sampleFile.length) {
	  for(let i = 0; i < sampleFile.length; i++) {
		  const imgTempPath = path.join(`public/temp/filename${i+1}.jpg`)
		  sampleFile[i].mv(imgTempPath, function(err) {
		    if (err)
		      return res.status(500).send(err)
		    console.log(`Moved File No.${i + 1}`);
		    console.log(`Filename : ${imgTempPath}`);
		    console.log(`Uploading File No.${i + 1}`);
			uploadImageToImgur(imgTempPath)
			})
	  	}
	}
	else {
  		const imgTempPath = path.join('public/temp/filename.jpg')
		sampleFile.mv(imgTempPath, function(err) {
		    if (err)
		      return res.status(500).send(err)
			uploadImageToImgur(imgTempPath)
		  })
	}
})

app.listen(PORT,() => {
	console.log("Listening on localhost:"+PORT)
})
