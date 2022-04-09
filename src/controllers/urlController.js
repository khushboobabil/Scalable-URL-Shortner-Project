const urlModel = require("../models/urlModels");
const nanoid = require("nanoid")
const redis = require("redis");
const { promisify } = require("util");

//Connection to Redis
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
const validUrl = (value) => {
    if (!(/(ftp|http|https|FTP|HTTP|HTTPS):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-/]))?/.test(value.trim()))) {
        return false
    }
    return true
}


//Converting long URL into Short URL.........................................................................

const shortenUrl = async (req, res) => {
    try {
        //our server base code
        const baseUrl = "http://localhost:3000";

        // 
        const query = req.query
       
        if (Object.keys(query) != 0) {
            return res.status(400).send({ status: false, message: "Invalid params present in URL" })
        }

        const data = req.body
        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, message: "Please provide URL" })
        }

        const { longUrl } = data
        //wih The help of Object distucturing we can store the Objects proporties in a Distinct Variable

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

            return res.status(200).send({ status: true, Message: "Success", Data: isUrlExist });
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
        return res.status(500).send({ status: false, Err: error.message });
    }
};

module.exports.shortenUrl = shortenUrl;





//Redirecting short url to long.......................................................................

const getUrl = async (req, res) => {
    try {
        const urlCode = req.params.urlCode.trim();
        //
        let cahcedUrlCode = await GET_ASYNC(`${urlCode}`)

        if (cahcedUrlCode) {

            return res.status(200).redirect(JSON.parse(cahcedUrlCode))

        }

        else {
            const url = await urlModel.findOne({
                urlCode: urlCode
            }).select({ longUrl: 1, urlCode: 1, shortUrl: 1, _id: 0 });
            if (!url) {
                return res.status(404).send({ status: false, message: "No URL found" })
            }
            else {
                let seturl=url.longUrl
                await SET_ASYNC(`${seturl}`, JSON.stringify(url))
                return res.status(302).redirect(seturl)
            }
        }
    }

    catch (error) {
        return res.status(500).send({ status: false, Message: error.message });
    }
};

module.exports.getUrl = getUrl;



