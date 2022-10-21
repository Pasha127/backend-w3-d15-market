import express from "express";
import { checkReviewSchema, checkValidationResult } from "./validator.js"
import createHttpError from "http-errors";
import reviewModel from "./model.js";
import q2m from "query-to-mongo";

const localEndpoint=`${process.env.LOCAL_URL}${process.env.PORT}/reviews`
/* const serverEndpoint= `${process.env.SERVER_URL}/reviewss` */


const reviewRouter = express.Router();

reviewRouter.get("/", async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET reviews at:", new Date());
        const mongoQuery = q2m.apply(req.query);
        const total = await ReviewModel.countDocuments(mongoQuery.criteria);
        const reviews = await reviewModel.find(
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
          reviews
        })        
    }catch(error){ 
        next(error)
    }    
})


reviewRouter.get("/:reviewId" , async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "GET review at:", new Date());       
        const foundReview = await reviewModel.findById(req.params.reviewId)       
        if(foundReview){
            res.status(200).send(foundReview);
        }else{next(createHttpError(404, "Review Not Found"));
    } 
    }catch(error){
        next(error);
    }
})


reviewRouter.post("/", checkReviewSchema, checkValidationResult, async (req,res,next)=>{
    try{
        console.log(req.headers.origin, "POST review at:", new Date());
        const newReview = new reviewModel(req.body);
        const{_id}= await newReview.save();

        res.status(201).send({message:`Added a new review.`,_id});
        
    }catch(error){
        next(error);
    }
})

reviewRouter.post("/images/:reviewId/pic",cloudinaryUploader, async (req,res,next)=>{try{     
     console.log("Tried to post a pic.", req.file.path);
     const foundReview = await reviewModel.findByIdAndUpdate(req.params.reviewId,
      {cover:req.file.path},
      {new:true,runValidators:true});
    
    res.status(201).send({message: "Review Pic Uploaded"});
}catch(error){ next(error) }});





reviewRouter.put("/:reviewId", async (req,res,next)=>{
    try{ const foundReview = await reviewModel.findByIdAndUpdate(req.params.reviewId,
      {...req.body},
      {new:true,runValidators:true});
        console.log(req.headers.origin, "PUT review at:", new Date());
        
        res.status(200).send(updatedReview);
        
    }catch(error){ 
        next(error);
    }
})


reviewRouter.delete("/:reviewId", async (req,res,next)=>{try{
    console.log(req.headers.origin, "DELETE review at:", new Date());
     const deletedReview =  await reviewModel.findByIdAndDelete(req.params.reviewId)      
    if(deletedReview){
      res.status(204).send({message:"review has been deleted."})
    }else{
      next(createHttpError(404, "review Not Found"));    
    }
}catch(error){
    next(error)
}
})


export default reviewRouter;