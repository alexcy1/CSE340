
const invModel = require('../models/inventory-model');
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

// module.exports = Util;



/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
    let grid = ''; // Ensure grid is initialized
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


  module.exports = Util
