
const urlModel = require("../models/urlModels");
const shortId = require("shortid")
const validUrl = require('valid-url')

const isValid = function (value) {
  if (typeof value == undefined || value == null) return false
  if (typeof value === 'string' && value.trim().length === 0) return false
  if (typeof value === 'Number' && value.toString().trim().length === 0) return false
  return true
}


const base = "http://localhost:3000";//our server base code


const createUrl = async (req, res) => {

  try {
    const data=req.body;

    if (!Object.keys(data).length>0) {return res.status(400).send({status: false, message: "please input Some data"})}

    const longUrl = data.longUrl;

    if(!isValid(longUrl)){return res.status(200).send({ status: false,message: "Please enter a URL" });}
    console.log(longUrl)
   
   if(!(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-]*)?\??(?:[\-\+=&;%@\.\w]*)#?(?:[\.\!\/\\\w]*))?)/.test( longUrl 
    ))){ return res.status(400).send({status:false, message: "please enter a valid URL"})
  }
  
//   if (!validUrl.isUri(baseUrl)) {
//     return res.status(401).send('Invalid base URL')
// }
   
    const urlCode = shortId.generate();
    console.log(urlCode)

    let url = await urlModel.findOne({ longUrl });
    if (url) {
      return res.json(url);
    } else {
      const shortUrl = `${base}/${urlCode}`;

      newUrl = {
        longUrl,
        shortUrl,
        urlCode,
      };
      
       const dbUrl = await urlModel.create(newUrl);
      return res.status(200).send({ status: true,data: newUrl });

    }
    
  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }
}


//redirecting short url to long ...............................

const getUrl = async (req, res) => {

  try {
    const urlCode = req.params.urlCode;
    const urlDocument = await urlModel.findOne({ urlCode: urlCode })
    if (!urlDocument) {
      res.status(404).send({ status: true, msg: "url Document not Found" })
    }
    const longUrl = urlDocument.longUrl
    return res.send({ status: true,data:longUrl })

  } catch (error) {
    return res.status(500).send({ status: false, message: error.message })
  }

}
module.exports.createUrl = createUrl;
module.exports.getUrl = getUrl;