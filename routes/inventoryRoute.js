
const express = require("express")
const router = new express.Router()
const invController = require("../controllers/invController")
const utilities = require("../utilities/")
const validationRules = require("../utilities/inventoryValidation")
const multer = require("multer")
const path = require("path")



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/images/vehicles")
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname))
  },
})
const upload = multer({ storage: storage })


// Route to build inventory by classification view
router.get(
  "/type/:classificationId",
  utilities.handleErrors(invController.buildByClassificationId))

// Route for vehicle detail view
router.get(
  "/detail/:invId",
  utilities.handleErrors(invController.buildByVehicleId))

// Route to inventory management view (protected)
router.get(
  "/",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(invController.buildManagement),
)

// Route to add classification view (protected)
router.get(
  "/add-classification",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(invController.buildAddClassification),
)

// Route to process add classification (protected)
router.post(
  "/add-classification",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  validationRules.validateClassification,
  utilities.handleErrors(invController.addClassification),
)

// Route to build the add inventory view (protected)
router.get(
  "/add-inventory",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(invController.buildAddInventory),
)

// Route to process the add inventory form (protected)
router.post(
  "/add-inventory",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  upload.fields([
    { name: "inv_image", maxCount: 1 },
    { name: "inv_thumbnail", maxCount: 1 },
  ]),
  validationRules.validateInventory,
  utilities.handleErrors(invController.addInventory),
)

// Route to get inventory data as JSON for a given classification
router.get(
  "/getInventory/:classification_id",
  utilities.handleErrors(invController.getInventoryJSON))

// Route for editing inventory (protected)
router.get(
  "/edit/:inv_id",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(invController.editInventoryView),
)

// Route to process the update inventory form (protected)
router.post(
  "/update",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  upload.fields([
    { name: "inv_image", maxCount: 1 },
    { name: "inv_thumbnail", maxCount: 1 },
  ]),
  validationRules.validateInventory,
  utilities.handleErrors(invController.updateInventory),
)

// Route to display the delete confirmation view (protected)
router.get(
  "/delete/:inv_id",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(invController.buildDeleteConfirmationView),
)

// Route to handle the delete process (protected)
router.post(
  "/delete",
  utilities.checkLogin,
  utilities.checkAdminOrEmployee,
  utilities.handleErrors(invController.deleteInventoryItem),
)

module.exports = router
