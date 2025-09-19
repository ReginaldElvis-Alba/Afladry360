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

export default {get_all_data};