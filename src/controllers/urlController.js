
const urlModel = require("../models/urlModels");
const shortid = require("shortid")
const validUrl = require('valid-url')
const redis = require("redis");
const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient({ host: 'redis-17454.c15.us-east-1-4.ec2.cloud.redislabs.com', port: 17454, username: 'functioup-free-db', password: 'yiIOJJ2luH3yHDzmp0WppDFtuUxn5aqO' });

//Successful connection to rediss
redisClient.on('connect',() => {
    console.log('connected to redis successfully!');
})

//unsuccesfull connection to redis
redisClient.on('error',(error) => {
    console.log('Redis connection error :', error);
})

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//Validation

const isValid = function (value) {
  if (typeof value == undefined || value == null) return false
  if (typeof value === 'string' && value.trim().length === 0) return false
  if (typeof value === 'Number' && value.toString().trim().length === 0) return false
  return true
}

//our server base code

const baseUrl = "http://localhost:3000";

//Converting long URL into Short URL

const createUrl = async function(req, res) {
  try {
     
      if (Object.entries(req.body).length == 0) {
          return res.status(400).send({ status: false, Message: "Invalid Request Params" });
      }

      const { longUrl } = req.body;

      if (!validUrl.isUri(baseUrl)) {
          return res.status(400).send({ status: false, Message: "invalid Base Url" });
      }

      const urlCode = shortid.generate().toLowerCase();

      if (!validUrl.isUri(longUrl)) {
          return res.status(400).send({ status: false, Message: "Invalid Long Url" });
      }

      let urlExist = await urlModel.findOne({ longUrl });
      if (urlExist) {
          return res.status(200).send({ status: true, Message: "This URL is already converted to Short URL", url: urlExist });
      }

      const shortUrl = baseUrl + "/" + urlCode;
      shortUrl.toLowerCase();
      const urlData = {
          longUrl,
          shortUrl,
          urlCode,
      };

      let newUrl = await urlModel.create(urlData);
      return res.status(201).send({ status: true, Message: "Sucessfully URL created", url: newUrl });

  } catch (error) {
      res.status(500).send({ status: false, Err: error.message });
  }
};
module.exports.createUrl = createUrl;

// const getUrl = async (req, res) => {

//   try {
//     const urlCode = req.params.urlCode;
//     if (!isValid(urlCode)) { return res.status(200).send({ status: false, message: "Please enter a urlCode" }); }

//     let urlDocument = await urlModel.findOne({ urlCode: urlCode })
//     if (!urlDocument) {
//       res.status(404).send({ status: true, msg: "url Document not Found" })
//     }
//     const longUrl = urlDocument.longUrl
   
//     return res.status(302).redirect(longUrl)

//   } catch (error) {
//     return res.status(500).send({ status: false, message: error.message })
//   }

// }

// module.exports.getUrl = getUrl;




//Redirecting short url to long

const getUrl = async (req, res) => {
  try {
      const urlCode = req.params.urlCode.trim();
      //
      let cahcedUrlCode = await GET_ASYNC(`${urlCode}`)
  
          if (cahcedUrlCode) {
  
              return res.status(200).redirect(JSON.parse(cahcedUrlCode))
  
          }
  
      const urlExist = await urlModel.findOne({ urlCode: urlCode });
  
      if (urlExist) {
          
          SET_ASYNC(`${urlCode}`, JSON.stringify(urlExist.longUrl))
  
          if (urlCode !== urlExist.urlCode) {
  
          return res.status(404).send({ status: false, Message: "No Url Found, Please Check Url Code", });
          }
          //let newRedirection=urlExist.longUrl
          return res.status(302).redirect(urlExist.longUrl);
      }
  
  } catch (error) {
      res.status(500).send({ status: false, Message: error.message });
  }
  };
  
  module.exports.getUrl = getUrl;