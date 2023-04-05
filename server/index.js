import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { Configuration,OpenAIApi } from 'openai';
import openAiRoutes from './routes/openai.js';

dotenv.config()

// App
const app = express();
app.use(express.json());
app.use(bodyParser.json({limit: '50mb',extended: true}))
app.use(bodyParser.urlencoded({limit: "50mb",extended: true}));
app.use(cors());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy: "cross-origin"}));
app.use(morgan('common'));

// OpenAI API
const config = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})

 export const openai = new OpenAIApi(config)

 // Routes
 app.use('/openai',openAiRoutes)






const PORT = process.env.PORT || 9000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`)
})