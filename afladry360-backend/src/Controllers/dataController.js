import dataService from "../Services/dataService.js";

const get_all_data = async (req, res) => {
    try {
        const data = await dataService.get_all_data();
        res.status(200).send(data);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error Sending Data!")
    }
}

const upload_to_blockchain = async (req,res)=>{
    try{
        await dataService.upload_to_blockchain(data)
    }catch(e){
        console.log(e);
        res.status(500).send("Error uploading to blockchain!");
    }
}

export default {get_all_data, upload_to_blockchain};