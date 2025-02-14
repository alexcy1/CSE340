
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
  const inv_id = req.params.invId;
  const data = await invModel.getVehicleById(inv_id);
  const loggedin = res.locals.loggedin || false; // Get loggedin status from res.locals
  const vehicleDetail = await utilities.buildVehicleDetail(data, loggedin); // Pass loggedin status
  const nav = await utilities.getNav();
  const vehicleName = `${data.inv_year} ${data.inv_make} ${data.inv_model}`;

  res.render("./inventory/detail", {
      title: vehicleName,
      nav,
      vehicleDetail,
  });
};



/* ***************************
 *  Build inventory management view
 * ************************** */
invCont.buildManagement = async function (req, res, next) {
  let nav = await utilities.getNav()
  const classificationSelect = await utilities.buildClassificationList()
  res.render("./inventory/management", {
    title: "Vehicle Management",
    nav,
    classificationSelect,
    errors: null,
  })
}



/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  const classification_id = Number.parseInt(req.params.classification_id)
  const invData = await invModel.getInventoryByClassificationId(classification_id)
  if (invData[0].inv_id) {
    return res.json(invData)
  } else {
    next(new Error("No data returned"))
  }
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
 *  Build delete confirmation view
 * ************************** */
invCont.buildDeleteConfirmationView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id);
  let nav = await utilities.getNav();
  const itemData = await invModel.getVehicleById(inv_id);
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`;

  res.render("./inventory/delete-confirm", {
    title: "Delete " + itemName,
    nav,
    errors: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_price: itemData.inv_price,
  });
};



/* ************************************
 *  Delete Inventory And Classification on last inventory Item
 * *********************************** */
invCont.deleteInventoryItem = async function (req, res, next) {
  const inv_id = parseInt(req.body.inv_id);

  // Step 1: Get the classification_id of the inventory item being deleted
  const itemData = await invModel.getVehicleById(inv_id);
  const classification_id = itemData.classification_id;

  // Step 2: Delete the inventory item
  const deleteResult = await invModel.deleteInventoryItem(inv_id);

  if (deleteResult) {
    // Step 3: Check if this was the last item in the classification
    const remainingItems = await invModel.getInventoryByClassificationId(classification_id);

    if (remainingItems.length === 0) {
      // Step 4: If no items remain, delete the classification
      const deleteClassificationResult = await invModel.deleteClassification(classification_id);

      if (deleteClassificationResult) {
        req.flash("success", "The inventory item and its classification were successfully deleted.");
      } else {
        req.flash("success", "The inventory item was deleted, but the classification could not be deleted.");
      }
    } else {
      req.flash("success", "The inventory item was successfully deleted.");
    }

    res.redirect("/inv");
  } else {
    req.flash("error", "Sorry, the delete failed.");
    res.redirect(`/inv/delete/${inv_id}`);
  }
};



/* ***************************
 *  Process add classification
 * ************************** */
invCont.addClassification = async (req, res, next) => {
  const errors = validationResult(req)
  const { classification_name } = req.body

  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("inventory/add-classification", {
      title: "Add New Classification",
      nav,
      errors: errors.array(),
      classification_name,
    })
    return
  } else {
    const result = await invModel.addClassification(classification_name)

    if (result) {
      req.flash("success", `Classification ${classification_name} added successfully.`)
      res.redirect("/inv")
    } else {
      req.flash("error", "Sorry, adding the classification failed.")
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
      "success",
      `Congratulations, you\'ve added ${inv_make} ${inv_model} to the inventory!`
    )
    res.redirect("/inv")
  } else {
    req.flash("error", "Sorry, the new vehicle registration failed.")
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



/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.editInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id);
  let nav = await utilities.getNav();
  const itemData = await invModel.getVehicleById(inv_id);
  const classificationSelect = await utilities.buildClassificationList(itemData.classification_id);
  const itemName = `${itemData.inv_make} ${itemData.inv_model}`;

  res.render("./inventory/edit-inventory", {
    title: "Edit " + itemName,
    nav,
    classificationSelect,
    errors: null,
    inv_id: itemData.inv_id,
    inv_make: itemData.inv_make,
    inv_model: itemData.inv_model,
    inv_year: itemData.inv_year,
    inv_description: itemData.inv_description,
    inv_image: itemData.inv_image,
    inv_thumbnail: itemData.inv_thumbnail,
    inv_price: itemData.inv_price,
    inv_miles: itemData.inv_miles,
    inv_color: itemData.inv_color,
    classification_id: itemData.classification_id,
  });
};



/* ***************************
 *  Process update inventory
 * ************************** */
invCont.updateInventory = async function (req, res, next) {
  console.log("Request Body:", req.body);
  let nav = await utilities.getNav();
  const {
    inv_id,
    inv_make,
    inv_model,
    inv_year,
    inv_description,
    inv_price,
    inv_miles,
    inv_color,
    classification_id
  } = req.body;

  let inv_image = req.files['inv_image'] ? '/images/vehicles/' + req.files['inv_image'][0].filename : null;
  let inv_thumbnail = req.files['inv_thumbnail'] ? '/images/vehicles/' + req.files['inv_thumbnail'][0].filename : null;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let classificationSelect = await utilities.buildClassificationList(classification_id);
    res.render("inventory/edit-inventory", {
      title: "Edit " + inv_make + " " + inv_model,
      nav,
      classificationSelect,
      errors: errors.array(),
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    });
    return;
  }

  const updateResult = await invModel.updateInventory(
    inv_id,
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
  );

  if (updateResult) {
    req.flash(
      "success",
      `Congratulations, you've updated ${inv_make} ${inv_model} in the inventory!`
    );
    res.redirect("/inv");
  } else {
    req.flash("error", "Sorry, the update failed.");
    res.status(501).render("inventory/edit-inventory", {
      title: "Edit " + inv_make + " " + inv_model,
      nav,
      classificationSelect: await utilities.buildClassificationList(classification_id),
      errors: null,
      inv_id,
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_price,
      inv_miles,
      inv_color,
      classification_id
    });
  }
};


module.exports = invCont
