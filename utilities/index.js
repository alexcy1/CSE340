
const invModel = require('../models/inventory-model');
const jwt = require("jsonwebtoken")
require("dotenv").config()
const Util = {};



/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
    let data = await invModel.getClassifications();
    let list = '<ul>';
    list += '<li><a href="/" title="Home page">Home</a></li>';
    data.rows.forEach((row) => {
        const classificationName = escapeHTML(row.classification_name);
        list += '<li>';
        list +=
            '<a href="/inv/type/' +
            row.classification_id +
            '" title="See our inventory of ' +
            classificationName +
            ' vehicles">' +
            classificationName +
            '</a>';
        list += '</li>';
    });
    list += '</ul>';
    return list;
};



/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
    let grid = '';
    if (data.length > 0) {
        grid = '<ul id="inv-display">';
        data.forEach((vehicle) => {
            const vehicleMake = escapeHTML(vehicle.inv_make);
            const vehicleModel = escapeHTML(vehicle.inv_model);
            grid += '<li>';
            grid +=
                '<a href="../../inv/detail/' +
                vehicle.inv_id +
                '" title="View ' +
                vehicleMake +
                ' ' +
                vehicleModel +
                ' details"><img src="' +
                vehicle.inv_thumbnail +
                '" alt="Image of ' +
                vehicleMake +
                ' ' +
                vehicleModel +
                ' on CSE Motors" /></a>';
            grid += '<div class="namePrice">';
            grid += '<hr />';
            grid += '<h2>';
            grid +=
                '<a href="../../inv/detail/' +
                vehicle.inv_id +
                '" title="View ' +
                vehicleMake +
                ' ' +
                vehicleModel +
                ' details">' +
                vehicleMake +
                ' ' +
                vehicleModel +
                '</a>';
            grid += '</h2>';
            grid +=
                '<span>$' +
                new Intl.NumberFormat('en-US').format(vehicle.inv_price) +
                '</span>';
            grid += '</div>';
            grid += '</li>';
        });
        grid += '</ul>';
    } else {
        grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>'; // Ensure grid is a string here
    }
    return grid;
};



/* **************************************
 * Build the vehicle detail view HTML
 * ************************************ */
Util.buildVehicleDetail = async (vehicle) => {
    const vehicleMake = escapeHTML(vehicle.inv_make);
    const vehicleModel = escapeHTML(vehicle.inv_model);
    const vehicleColor = escapeHTML(vehicle.inv_color);
    const vehicleDescription = escapeHTML(vehicle.inv_description);

    let html = '<div class="vehicle-detail">';
    html += `<img src="${vehicle.inv_image}" alt="${vehicleMake} ${vehicleModel}" />`;
    html += `<h2>${vehicleMake} ${vehicleModel}</h2>`;
    html += `<p class="price">Price: $${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</p>`;
    html += `<p>Year: ${vehicle.inv_year}</p>`;
    html += `<p>Mileage: ${new Intl.NumberFormat("en-US").format(vehicle.inv_miles)} miles</p>`;
    html += `<p>Color: ${vehicleColor}</p>`;
    html += `<p class="description">${vehicleDescription}</p>`;
    html += "</div>";
    return html;
};



/* ****************************************
 * General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/**
 * Helper function to escape HTML
 */
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ************************
 * Build the classification select list
 ************************** */
Util.buildClassificationList = async function(classification_id = null){
    let data = await invModel.getClassifications()
    let classificationList =
      '<select name="classification_id" id="classificationList" required>'
    classificationList += "<option value=''>Choose a Classification</option>"
    data.rows.forEach((row) => {
      classificationList += '<option value="' + row.classification_id + '"'
      if (classification_id != null && row.classification_id == classification_id) {
        classificationList += " selected "
      }
      classificationList += ">" + row.classification_name + "</option>"
    })
    classificationList += "</select>"
    return classificationList
  }



/* ****************************************
* Middleware to check token validity
**************************************** */
Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
     jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
       if (err) {
        req.flash("Please log in")
        res.clearCookie("jwt")
        return res.redirect("/account/login")
       }
       res.locals.accountData = accountData
       res.locals.loggedin = 1
       next()
      })
    } else {
     next()
    }
   }



/* ****************************************
 * Middleware to check if user is logged in
 **************************************** */
Util.checkLogin = (req, res, next) => {
    console.log("Checking if user is logged in")
    if (res.locals.loggedin) {
      console.log("User is logged in")
      next()
    } else {
      console.log("User is not logged in, redirecting to login")
      req.flash("notice", "Please log in.")
      return res.redirect("/account/login")
    }
  }



/* ****************************************
 * Middleware to check and verify the JWT cookie.
 **************************************** */
  Util.checkJWTToken = (req, res, next) => {
    if (req.cookies.jwt) {
      jwt.verify(
        req.cookies.jwt,
        process.env.ACCESS_TOKEN_SECRET,
        function (err, accountData) {
          if (err) {
            req.flash("Please log in");
            res.clearCookie("jwt");
            return res.redirect("/account/login");
          }
          res.locals.accountData = accountData; 
          res.locals.loggedin = 1;
          next();
        }
      );
    } else {
      next();
    }
  };



/* ****************************************
 * Middleware to check if user is Employee or Admin
 **************************************** */
Util.checkAdminOrEmployee = (req, res, next) => {
  if (res.locals.loggedin) {
    const accountType = res.locals.accountData.account_type
    if (accountType === "Employee" || accountType === "Admin") {
      next()
    } else {
      req.flash("error", "You do not have permission to access the Managment page. Please login as Admin/Employee to have access")
      return res.redirect("/account/login")
    }
  } else {
    req.flash("error", "Please log in.")
    return res.redirect("/account/login")
  }
}



// =========================== MY PROJECT IN VIEW =============================

/* ****************************************
 * Middleware to check if user is an Admin
 **************************************** */
Util.checkAdmin = (req, res, next) => {
  if (res.locals.loggedin) {
    const accountType = res.locals.accountData.account_type;
    if (accountType === "Admin") {
      next();
    } else {
      req.flash("error", "You do not have permission to access this page. Please login as an Admin.");
      return res.redirect("/account/");
    }
  } else {
    req.flash("error", "Please log in.");
    return res.redirect("/account/login");
  }
};


module.exports = Util
