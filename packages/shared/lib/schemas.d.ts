import Joi from 'joi';
export declare const baseMessageSchema: Joi.ObjectSchema<any>;
export declare const userAddSchema: Joi.ObjectSchema<any>;
export declare const configUpdateSchema: Joi.ObjectSchema<any>;
export declare const nodeRegisterSchema: Joi.ObjectSchema<any>;
export declare const validateWithSchema: (message: any, schema: Joi.ObjectSchema) => any;
