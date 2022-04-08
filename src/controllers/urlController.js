
const urlModel = require("../models/urlModels");
const nanoid = require("nanoid")
const redis = require("redis");
const { promisify } = require("util");

//Connect to redis
const redisClient = redis.createClient({ host: 'redis-17454.c15.us-east-1-4.ec2.cloud.redislabs.com', port: 17454, username: 'functioup-free-db', password: 'yiIOJJ2luH3yHDzmp0WppDFtuUxn5aqO' });

//Successful connection to redis
redisClient.on('connect', () => {
    console.log('connected to redis successfully!');
})

//unsuccesfull connection to redis
redisClient.on('error', (error) => {
    console.log('Redis connection error :', error);
})

//Connection setup for redis
const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

//Validation

// const isValid = function (value) {
//     if (typeof value == undefined || value == null) return false
//     if (typeof value === 'string' && value.trim().length === 0) return false
//     if (typeof value === 'Number' && value.toString().trim().length === 0) return false
//     return true
// }

const validUrl = (value) => {
    if (!(/(ftp|http|https|FTP|HTTP|HTTPS):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(value.trim()))) {
        return false
    }
    return true
}


//Converting long URL into Short URL

const shortenUrl = async (req, res) => {
    try {
        //our server base code
        const baseUrl = "http://localhost:3000";

        if (Object.entries(req.body).length == 0 || Object.entries(req.body).length > 1) {
            return res.status(400).send({ status: false, Message: "Invalid Request Params" });
        }

        if (!req.body.hasOwnProperty('longUrl')) {
            return res.status(400).send({ Status: false, Message: "Wrong Key Present" })
        }

        const { longUrl } = req.body;
        //wih The help of Object distucturing we can store the Ojects proporties in a Distinct Variable

        if (!longUrl) {
            return res.status(400).send({ Status: false, Message: "Url Is Required" })
        }

        if (!validUrl(baseUrl)) {
            return res.status(400).send({ status: false, Message: "invalid Base Url" });
        }

        if (!validUrl(longUrl)) {
            return res.status(400).send({ status: false, Message: "Invalid Long Url" });
        }
        //
        const cahcedUrlData = await GET_ASYNC(`${longUrl}`)
        if (cahcedUrlData) {
            return res.status(200).send({ status: "true", data: cahcedUrlData })
        }

        let isUrlExist = await urlModel.findOne({ longUrl }).select({ longUrl: 1, urlCode: 1, shortUrl: 1, _id: 0 });
        if (isUrlExist) {
            
            await SET_ASYNC(`${longUrl}`, JSON.stringify(isUrlExist))

            return res.status(201).send({ status: true, Message: "Success", Data: isUrlExist });
        }


        const urlCode = nanoid.nanoid().toLowerCase();
        const shortUrl = baseUrl + "/" + urlCode;
        shortUrl.toLowerCase();

        const urlData = {
            longUrl,
            shortUrl: shortUrl.trim(),
            urlCode,
        };

        let newUrl = await urlModel.create(urlData)

        let finalData = {
            urlCode: newUrl.urlCode,
            longUrl: newUrl.longUrl,
            shortUrl: newUrl.shortUrl
        }
        return res.status(201).send({ status: true, Message: "success", Data: finalData });

    } catch (error) {
        res.status(500).send({ status: false, Err: error.message });
    }
};

module.exports.shortenUrl = shortenUrl;





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

            SET_ASYNC(`${urlCode}`, 60 * 60, JSON.stringify(urlExist.longUrl))

            if (urlCode !== urlExist.urlCode) {

                return res.status(404).send({ status: false, Message: "No Url Found, Please Check Url Code", });
            }
            //let newRedirection=urlExist.longUrl
            return res.status(302).redirect(urlExist.longUrl);
        }

    } catch (error) {
        return res.status(500).send({ status: false, Message: error.message });
    }
};

module.exports.getUrl = getUrl;


