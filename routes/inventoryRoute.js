
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const validationRules = require("../utilities/inventoryValidation")
const multer = require('multer')
const path = require('path');



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/images/vehicles')
    },
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
  })

  const upload = multer({ storage: storage })


// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId))

// Route for vehicle detail view
router.get("/detail/:invId", utilities.handleErrors(invController.buildByVehicleId))

// Route to inventory management view
router.get("/", utilities.handleErrors(invController.buildManagement))

// Route to add classification view
router.get("/add-classification", utilities.handleErrors(invController.buildAddClassification))

// Route to process add classification
router.post(
    "/add-classification",
    validationRules.validateClassification,
    utilities.handleErrors(invController.addClassification)
  )

// Route to build the add inventory view
router.get("/add-inventory", utilities.handleErrors(invController.buildAddInventory))

// Route to process the add inventory form
router.post(
    "/add-inventory",
    upload.fields([{ name: 'inv_image', maxCount: 1 }, { name: 'inv_thumbnail', maxCount: 1 }]),
    validationRules.validateInventory,
    utilities.handleErrors(invController.addInventory)
  )


module.exports = router
