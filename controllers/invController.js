
const invModel = require("../models/inventory-model")
const utilities = require("../utilities")
const multer = require('multer')
const path = require('path')
const { body, validationResult } = require('express-validator')


const invCont = {}

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/vehicles')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })


/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = async (req, res, next) => {
  const classification_id = req.params.classificationId
  const data = await invModel.getInventoryByClassificationId(classification_id)
  const grid = await utilities.buildClassificationGrid(data)
  const nav = await utilities.getNav()
  const className = data[0].classification_name
  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  })
}


/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildByVehicleId = async (req, res, next) => {
  const inv_id = req.params.invId
  const data = await invModel.getVehicleById(inv_id)
  const vehicleDetail = await utilities.buildVehicleDetail(data)
  const nav = await utilities.getNav()
  const vehicleName = `${data.inv_year} ${data.inv_make} ${data.inv_model}`
  res.render("./inventory/detail", {
    title: vehicleName,
    nav,
    vehicleDetail,
  })
}


/* ***************************
 *  Build inventory management view
 * ************************** */
invCont.buildManagement = async function (req, res, next) {
  let nav = await utilities.getNav()
  res.render("./inventory/management", {
    title: "Inventory Management",
    nav,
    errors: null,
  })
}


/* ***************************
 *  Build add classification view
 * ************************** */
invCont.buildAddClassification = async function (req, res, next) {
  let nav = await utilities.getNav()
  res.render("./inventory/add-classification", {
    title: "Add New Classification",
    nav,
    errors: null,
    classification_name: '',
  })
}


/* ***************************
 *  Process add classification
 * ************************** */
invCont.addClassification = async (req, res, next) => {
  // Extract the validation errors from a request
  const errors = validationResult(req)
  const { classification_name } = req.body

  if (!errors.isEmpty()) {
    // There are errors. Render the form again with sanitized values/error messages.
    let nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: errors.array(),
      classification_name,
    })
    return
  } else {
    // Data from form is valid.
    const result = await invModel.addClassification(classification_name)

    if (result) {
      req.flash("notice", `Classification ${classification_name} added successfully.`)
      res.redirect("/inv")
    } else {
      req.flash("notice", "Sorry, adding the classification failed.")
      res.status(501).render("inventory/add-classification", {
        title: "Add New Classification",
        nav: await utilities.getNav(),
        errors: null,
        classification_name,
      })
    }
  }
}


/* ***************************
 *  Build add inventory view
 * ************************** */
invCont.buildAddInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  let classificationSelect = await utilities.buildClassificationList()
  res.render("./inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationSelect,
    errors: null,
  })
}


/* ***************************
 *  Process add inventory
 * ************************** */
invCont.addInventory = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_price,
    inv_miles,
    inv_color,
    classification_id
  } = req.body

  let inv_image = '/images/vehicles/no-image.png'
  let inv_thumbnail = '/images/vehicles/no-image-tn.png'

  if(req.files['inv_image']){
    inv_image = '/images/vehicles/' + req.files['inv_image'][0].filename
  }
  if(req.files['inv_thumbnail']){
    inv_thumbnail = '/images/vehicles/' + req.files['inv_thumbnail'][0].filename
  }

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    let classificationSelect = await utilities.buildClassificationList(classification_id)
    res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationSelect,
      errors: errors.array(),
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    })
    return
  }

  const inventoryResult = await invModel.addInventory(
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_image,
    inv_thumbnail,
    inv_price,
    inv_miles,
    inv_color,
    classification_id
  )

  if (inventoryResult) {
    req.flash(
      "notice",
      `Congratulations, you\'ve added ${inv_make} ${inv_model} to the inventory!`
    )
    res.redirect("/inv")
  } else {
    req.flash("notice", "Sorry, the new vehicle registration failed.")
    res.status(501).render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationSelect: await utilities.buildClassificationList(classification_id),
      errors: null,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    })
  }
}


module.exports = invCont
