import {Schema, model} from "mongoose";

const reviewDbSchema = new Schema(
    {
      comment: { type: String, required: true },
      rate: { type: Number, min: 1, max: 5, default: 5, required: true },
    },
    {timestamps: true}
  )
  
const productDbSchema = new Schema(
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      brand: { type: String, required: true },
      imageUrl: { type: String, required: true },
      price: { type: Number, required: true },
      category: { type: String, required: true },
      reviews:[/* { 
        type: Schema.Types.ObjectId, ref: "Review" 
        } */
        reviewDbSchema
    ]
    },
    {timestamps: true}
  )
  
  export default model("Product", productDbSchema)