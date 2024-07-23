import mongoose from 'mongoose'


const userdataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
})

const Userdata = mongoose.model('Userdata', userdataSchema);

export default Userdata;