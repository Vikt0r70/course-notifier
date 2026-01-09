import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res
        .status(400)
        .json({ success: false, message: "Validation failed", errors });
    }

    next();
  };
};

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  username: Joi.string().min(3).max(100).required(),
  password: Joi.string().min(6).required(), // Changed to min 6 to match all frontends
  major: Joi.string().allow("", null).optional(), // Now optional - nullable in DB
  age: Joi.number().min(16).max(100).allow(null).optional(), // Now optional - nullable in DB
  faculty: Joi.string().allow("", null).optional(), // Optional for postgraduate
  studyType: Joi.string()
    .valid("بكالوريوس", "دراسات عليا", "Bachelor", "Postgraduate")
    .required(), // Accept both Arabic and English
  timeShift: Joi.when("studyType", {
    is: Joi.valid("بكالوريوس", "Bachelor"),
    then: Joi.string()
      .valid("صباحي", "مسائي", "الكل", "Morning", "Evening", "All")
      .allow("")
      .optional(),
    otherwise: Joi.string().allow("", null).optional(), // Allow empty/null for postgraduate
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const watchlistSchema = Joi.object({
  courseCode: Joi.string().required(),
  section: Joi.string().required(),
  courseName: Joi.string().required(),
  faculty: Joi.string().optional(),
  instructor: Joi.string().optional(),
  notifyOnOpen: Joi.boolean().optional(),
  notifyOnClose: Joi.boolean().optional(),
  notifyOnSimilarCourse: Joi.boolean().optional(),
  notifyByEmail: Joi.boolean().optional(),
  notifyByWeb: Joi.boolean().optional(),
  notifyByPhone: Joi.boolean().optional(),
});

// Schema for updating global notification settings (on User)
export const notificationSettingsSchema = Joi.object({
  notifyOnOpen: Joi.boolean().optional(),
  notifyOnClose: Joi.boolean().optional(),
  notifyOnSimilarCourse: Joi.boolean().optional(),
  notifyByEmail: Joi.boolean().optional(),
  notifyByWeb: Joi.boolean().optional(),
  notifyByPhone: Joi.boolean().optional(),
});
