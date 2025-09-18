import express from "express";
import env from "dotenv"
env.config();

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req, res)=>{
res.send("Hello world!")
});

app.listen(port, ()=>{
    console.log(`app listening on port ${port}`)
})