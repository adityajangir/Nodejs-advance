import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import querystring from 'querystring'
import jwt from "jsonwebtoken";
import axios from "axios";
import cookieParser from "cookie-parser";
import Userdata from './models/usermodel.js';
import authenticateToken from './middleware/authMiddleware.js'
import Inputdata from './models/inputmodel.js';


const app = express();
dotenv.config();
const mongoDbURL = process.env.mongourl;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

mongoose.connect(mongoDbURL)
.then(()=>{
    console.log("Connected to MongoDB");
})
.catch(()=>{
    console.log("Couldn't connect to MongoDB");
})


app.use(express.json());

app.use(cookieParser());

const redirectURI = "auth/google/redirect";

function getGoogleAuthURL() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: `http://localhost:3000/${redirectURI}`,
    client_id: CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
  return `${rootUrl}?${querystring.stringify(options)}`;
}

// Getting login URL
app.get("/auth/google", (req, res) => {
  return res.redirect(getGoogleAuthURL());
});             

async function getTokens({ code, clientId, clientSecret, redirectUri }) {
  const url = "https://oauth2.googleapis.com/token";
  const values = {
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  };

  try {
    const response = await axios.post(url, querystring.stringify(values), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    return response.data;
  } catch (error) {
    console.error(`Failed to fetch auth tokens: ${error.message}`);
    throw new Error(error.message);
  }
}

// Getting the user from Google with the code
app.get(`/${redirectURI}`, async (req, res) => {
    try{
        const code = req.query.code;
        console.log(code);
        const { id_token, access_token } = await getTokens({
          code,
          clientId: CLIENT_ID,
          clientSecret: CLIENT_SECRET,
          redirectUri: `http://localhost:3000/${redirectURI}`,
        });
      
        // Fetch the user's profile with the access token and bearer
        const googleUser = await axios
          .get(
            `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`,
            {
              headers: {
                Authorization: `Bearer ${id_token}`,
              },
            }
          )
          .then((res) => res.data)
          .catch((error) => {
            console.error(`Failed to fetch user`);
            throw new Error(error.message);
          });
          const currUser = new Userdata({
            name: googleUser.name,
            email: googleUser.email
          })
          currUser.save();
          const token = jwt.sign(googleUser, JWT_SECRET);
      
        res.cookie("AuthCookie", token, {
          maxAge: 1800000       // expiration set to 30 mins
        });
      
        res.redirect('/');
    }catch(error){
        console.log("Error getting the user!")
    }
});

// Getting the current user
app.get("/", authenticateToken, (req, res) => {
  res.send("This is route is authenticated.")
});

app.get('/getallusers', async (req, res)=> {
  const users = await Userdata.find();
  res.send({Message: "This route is unprotected.", Data: users});
})



app.get('/customer', authenticateToken, async (req, res) => {
  try {
    const aggResult = await Inputdata.aggregate([
      {
        $match: {
          customer_name: "Aditya Jangir"
        },
      },
      {
        $addFields: {
          newincome: { $multiply: [2, '$monthly_income'] }, // Add new field newincome
        },
      },
      {
        $project: {
          customer_name: 1,
          monthly_income: 1,
          newincome: 1
        }
      },
    ]);
    console.log(aggResult); 
    res.json(aggResult);
  } catch (error) {
    console.error('Error fetching aggregated sales data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


app.listen(3000, () => {
    console.log("Server running at port 3000");
})


