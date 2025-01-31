
const { body } = require('express-validator')

// utilities/inventoryValidation.js
const validationRules = {
  validateClassification: [
    body('classification_name')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Classification name must be provided.')
      .matches(/^[a-zA-Z0-9]+$/)
      .withMessage('Classification name must contain only alphanumeric characters.')
  ],

  validateInventory: [
    body('inv_make')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Vehicle make is required.'),
    body('inv_model')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Vehicle model is required.'),
    body('inv_year')
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be between 1900 and next year.'),
    body('inv_description')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Description is required.'),
    body('inv_price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number.'),
    body('inv_miles')
      .isInt({ min: 0 })
      .withMessage('Mileage must be a positive integer.'),
    body('inv_color')
      .trim()
      .isLength({ min: 1 })
      .withMessage('Color is required.'),
    body('classification_id')
      .isInt({ min: 1 })
      .withMessage('Valid classification is required.')
  ]
}


module.exports = validationRules
