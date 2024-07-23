import mongoose from 'mongoose'


const inputdataSchema = new mongoose.Schema({
    customer_name: {
        type: String,
        required: true      
    },
    monthly_income: {
        type: Number,
        required: true
    },
    dob: {
        type: Date,
        required: true
    }
})

const Inputdata = mongoose.model('Inputdata', inputdataSchema);

export default Inputdata