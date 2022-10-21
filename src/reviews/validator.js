import { checkSchema, validationResult } from "express-validator"
import createHttpError from "http-errors"

const reviewSchema = {
  comment: {
    in: ["body"],
    isString: {
      errorMessage: "Name is a mandatory field and needs to be a string!",
    },
  },
  rate: {
    in: ["body"],
    isNumber: {
      errorMessage: "Rating is a mandatory field and needs to be a number! (1-5)",
    },
  }
  
}



export const checkReviewSchema = checkSchema(reviewSchema) 
export const checkValidationResult = (req, res, next) => { 
  const errors = validationResult(req)
  if (!errors.isEmpty()) {   
    next(
      createHttpError(400, "Validation errors in request body!", {
        errorsList: errors.array(),
      })
    );
    console.log("400here", errors);
  } else {
    next()
  }
}