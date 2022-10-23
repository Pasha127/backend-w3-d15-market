import express from "express";
import { checkProductSchema, checkValidationResult } from "./validator.js"
import { checkReviewSchema } from "../reviews/validator.js"
import { checkValidationResult as checkReviewValidationResult } from "../reviews/validator.js"
import multer from "multer"; 
import createHttpError from "http-errors";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import productModel from "./model.js";
import reviewModel from "../reviews/model.js"
import q2m from "query-to-mongo";

const localEndpoint=`${process.env.LOCAL_URL}${process.env.PORT}/products`
/* const serverEndpoint= `${process.env.SERVER_URL}/products` */


const cloudinaryUploader = multer({
    storage: new CloudinaryStorage({
      cloudinary, 
      params: {folder: "Products"},
    }),
    limits: { fileSize: 1024 * 1024 },
  }).single("image")

const productRouter = express.Router();

productRouter.get("/", async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET products at:", new Date());
        const mongoQuery = q2m.apply(req.query);
        const total = await productModel.countDocuments(mongoQuery.criteria);
        const products = await productModel.find(
          mongoQuery.criteria,
          mongoQuery.options.fields
        )
        .sort(mongoQuery.options.sort)
        .skip(mongoQuery.options.skip)
        .limit(mongoQuery.options.limit)
        res.status(200).send({
          links:mongoQuery.links(localEndpoint,total),
          total,
          totalPages: Math.ceil(total/mongoQuery.options.limit), 
          products
        })        
    }catch(error){ 
        next(error)
    }    
})


productRouter.get("/:productId" , async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET product at:", new Date());       
        const foundProduct = await productModel.findById(req.params.productId)       
        if(foundProduct){
            res.status(200).send(foundProduct);
        }else{next(createHttpError(404, "Product Not Found"));
    } 
    }catch(error){
        next(error);
    }
})


productRouter.post("/", checkProductSchema, checkValidationResult, async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "POST product at:", new Date());
        const newProduct = new productModel(req.body);
        const{_id}= await newProduct.save();

        res.status(201).send({message:`Added a new product.`,_id});
        
    }catch(error){
        next(error);
    }
})






productRouter.put("/images/:productId/pic",cloudinaryUploader, async (req,res,next)=>{try{     
    console.log("Tried to put a pic.", req.file.path);
    const foundProduct = await productModel.findByIdAndUpdate(req.params.productId,
        {imageUrl:req.file.path},
        {new:true,runValidators:true});
        
        res.status(201).send({message: "Product Pic Uploaded"});
    }catch(error){ next(error) }});
    

    
    
    
    productRouter.put("/:productId", async (req,res,next)=>{
        try{ const foundProduct = await productModel.findByIdAndUpdate(req.params.productId,
            {...req.body},
            {new:true,runValidators:true});
            console.log(req.headers.origin, "PUT product at:", new Date());
            
            res.status(200).send(updatedProduct);
            
        }catch(error){ 
            next(error);
        }
    })
    
    
    productRouter.delete("/:productId", async (req,res,next)=>{try{
        console.log(req.headers.origin, "DELETE product at:", new Date());
        const deletedProduct =  await productModel.findByIdAndDelete(req.params.productId)      
        if(deletedProduct){
            res.status(204).send({message:"product has been deleted."})
        }else{
            next(createHttpError(404, "product Not Found"));    
        }
    }catch(error){
        next(error)
    }
})
//______________-------------reviews---------------__________________
productRouter.post("/:productId/reviews/", checkReviewSchema, checkReviewValidationResult, async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "POST product review at:", new Date());
        const product = await productModel.findByIdAndUpdate(
            req.params.productId,
            { $push: { reviews: req.body } },
            { new: true, runValidators: true }
          );     

        res.status(201).send({message:`Added a new review.`});
        
    }catch(error){
        console.log(error);
    }
})
productRouter.get("/:productId/reviews/:reviewId" , async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET product at:", new Date());       
        const foundProduct = await productModel.findById(req.params.productId)       
        if(foundProduct){
            const foundReview = foundProduct.reviews.find(review => review._id.toString()===req.params.reviewId)
            console.log(foundReview)
            if(foundReview){
            res.status(200).send(foundReview);
            }else{next(createHttpError(404, "Review Not Found"));}
        }else{next(createHttpError(404, "Product Not Found"));
    } 
    }catch(error){
        console.log(error);
    }
})
productRouter.get("/:productId/reviews" , async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET product at:", new Date());       
        const foundProduct = await productModel.findById(req.params.productId)       
        if(foundProduct){
            res.status(200).send(foundProduct.reviews);            
        }else{next(createHttpError(404, "Product Not Found"));
    } 
}catch(error){
    console.log(error);
}
})

productRouter.put("/:productId/reviews/:reviewId" , async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET product at:", new Date());       
        const foundProduct = await productModel.findById(req.params.productId);
        if(foundProduct){
            const foundReviewIndex = foundProduct.reviews.findIndex(review => review._id.toString()===req.params.reviewId);
            if(foundReviewIndex>-1){
                const reviewsArr = foundProduct.toObject().reviews;
                const newReviewsArr = reviewsArr.splice(foundReviewIndex,1,{...reviewsArr[foundReviewIndex], ...req.body})
                const updatedId = await productModel.findOneAndUpdate(req.params.productId,{reviews: newReviewsArr},{new:true});
            res.status(200).send({message: "Review updated successfully!",_id:updatedId});
            }else{next(createHttpError(404, "Review Not Found"));}
        }else{next(createHttpError(404, "Product Not Found"));
    } 
    }catch(error){
        console.log(error);
    }
})

productRouter.delete("/:productId/reviews/:reviewId" , async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET product at:", new Date());       
        const foundProduct = await productModel.findById(req.params.productId)       
        if(foundProduct){
            const foundReview = foundProduct.reviews.find(review => review._id.toString()===req.params.reviewId)
            console.log(foundReview)
            const foundReviewIndex = foundProduct.reviews.findIndex(review => review._id.toString()===req.params.reviewId)
            if(foundReviewIndex>-1){
                const deletedReview = await productModel.findOneAndUpdate(req.params.productId,{$pull:{reviews:{_id: req.params.reviewId}}},{new:true});
            res.status(200).send(foundReview);
            }else{next(createHttpError(404, "Review Not Found"));}
        }else{next(createHttpError(404, "Product Not Found"));
    } 
    }catch(error){
        console.log(error);
    }
})

export default productRouter;