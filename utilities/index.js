
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
Util.buildVehicleDetail = async (vehicle, loggedin) => {
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

  // Add Order Now button if the user is logged in
  if (loggedin) {
      html += `
          <form action="/account/place-order" method="post">
              <input type="hidden" name="inv_id" value="${vehicle.inv_id}">
              <button type="submit" class="order-button">Order Now</button>
          </form>
      `;
  }

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



/* **************************************
 * Build the manage orders view HTML
 * ************************************ */
Util.buildManageOrders = async (orders, statuses, user) => {
  let html = '<div class="manage-orders-container">';

  // Check if the user object is valid
  if (!user) {
    html += `<p>User not found.</p>`;
    return html;
  }

  html += `
      <span>
          <h1>Manage Orders for ${user.account_firstname} ${user.account_lastname}</h1>
          <a href="/account/user-list">
              <button>Back to User List</button>
          </a>
          <a href="/account/order-history">
              <button>History</button>
          </a>
      </span>
  `;

  if (orders.length > 0) {
      html += `
          <table>
              <thead>
                  <tr>
                      <th>Vehicle</th>
                      <th>Price</th>
                      <th>Year</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Update Status</th>
                      <th>Delete</th>
                  </tr>
              </thead>
              <tbody>
      `;

      orders.forEach(order => {
          html += `
              <tr>
                  <td>
                      <img src="${order.inv_image}" alt="${order.inv_make} ${order.inv_model}" width="100">
                      <div>${order.inv_make} ${order.inv_model}</div>
                  </td>
                  <td>$${new Intl.NumberFormat("en-US").format(order.inv_price)}</td>
                  <td>${order.inv_year}</td>
                  <td>${new Date(order.order_date).toLocaleDateString()}</td>
                  <td class="${order.status_name === 'Approved' ? 'status-approved' : ''}">${order.status_name}</td>
                  <td>

                      <form action="/account/update-order" method="post">
                          <input type="hidden" name="order_id" value="${order.order_id}">
                          <input type="hidden" name="user_id" value="${user.account_id}"> <!-- Add user_id -->
                          <select name="status_id">

          `;

          statuses.forEach(status => {
              html += `<option value="${status.status_id}" ${order.status_id === status.status_id ? 'selected' : ''}>${status.status_name}</option>`;
          });

          html += `
                          </select>
                          <button type="submit" class="update-order">Update</button>
                      </form>
                  </td>
                  <td>
                      <form action="/account/delete-order" method="post" onsubmit="return confirm('Are you sure you want to delete this order?');">
                          <input type="hidden" name="order_id" value="${order.order_id}">
                          <button type="submit" class="delete-button">
                          <i class="fa fa-trash-o"></i> Delete
                          </button>
                      </form>
                  </td>
              </tr>
          `;
      });

      html += `</tbody></table>`;
  } else {
      html += `<p>No orders found for this user.</p>`;
  }

  html += '</div>';
  return html;
};




/* **************************************
 * Build the user orders view HTML
 * ************************************ */
Util.buildUserOrders = async (orders) => {
  let html = '<div class="orders-container">';

  html += `
      <span>
          <h1>My Orders</h1>
          <a href="/account/order-history">
              <button class="history">History</button>
          </a>
      </span>
  `;

  if (orders.length > 0) {
      html += `
          <table>
              <thead>
                  <tr>
                      <th>Vehicle</th>
                      <th>Price</th>
                      <th>Year</th>
                      <th>Color</th>
                      <th>Order Date</th>
                      <th>Status</th>
                      <th>Action</th>
                  </tr>
              </thead>
              <tbody>
      `;

      orders.forEach(order => {
          html += `
              <tr>
                  <td>
                      <img src="${order.inv_image}" alt="${order.inv_make} ${order.inv_model}" width="100">
                      <div>${order.inv_make} ${order.inv_model}</div>
                  </td>
                  <td>$${new Intl.NumberFormat("en-US").format(order.inv_price)}</td>
                  <td>${order.inv_year}</td>
                  <td>${order.inv_color}</td>
                  <td>${new Date(order.order_date).toLocaleDateString()}</td>
                  <td class="${order.status_name === 'Approved' ? 'status-approved' : ''}">${order.status_name}</td>
                  <td>
                      ${order.status_name === 'Pending' ? `
                          <form action="/account/delete-order" method="post" onsubmit="return confirm('Are you sure you want to delete this order?');">
                              <input type="hidden" name="order_id" value="${order.order_id}">
                              <button type="submit" class="delete-button">
                                <i class="fa fa-trash-o"></i> Delete
                              </button>
                          </form>
                      ` : ''}
                  </td>
              </tr>
          `;
      });

      html += `</tbody></table>`;
  } else {
      html += `<p>You have no orders.</p>`;
  }

  html += '</div>';
  return html;
};




  /* **************************************
   * Build the user list view HTML
   * ************************************ */
  Util.buildUserListView = async (users, messages) => {
    let html = '<div class="user-list-container">';

    html += `
        <h1>User List - Users with Orders</h1>
    `;

    // Add success message if present
    if (messages && messages.success) {
      html += `<div class="success-message">${messages.success}</div>`;
    }

    // Add error message if present
    if (messages && messages.error) {
      html += `<div class="error-message">${messages.error}</div>`;
    }

    // Check if there are users
    if (users.length > 0) {
      html += `<p>Showing users who have placed orders.</p>`;
      html += `
          <table>
              <thead>
                  <tr>
                      <th>First Name</th>
                      <th>Last Name</th>
                      <th>Email</th>
                      <th>Action</th>
                  </tr>
              </thead>
              <tbody>
      `;

      // Loop through users and add rows to the table
      users.forEach((user) => {
        html += `
              <tr>
                  <td>${user.account_firstname}</td>
                  <td>${user.account_lastname}</td>
                  <td>${user.account_email}</td>
                  <td>
                      <a href="/account/manage-orders/${user.account_id}">
                          <button>View Orders</button>
                      </a>
                  </td>
              </tr>
          `;
      });

      html += `</tbody></table>`;
    } else {
      html += `<p>No users with orders found.</p>`;
    }

    html += "</div>";
    return html;
  },




    /* **************************************
     * Build the manage users view HTML
     * ************************************ */
    Util.buildManageUsersView = async (users, messages, errors) => {
      let html = '<div class="manage-users-container">';

      // Display Flash Messages
      if (messages && messages.success) {
        html += `<div class="success-message">${messages.success}</div>`;
      }

      if (messages && messages.error) {
        html += `<div class="error-message">${messages.error}</div>`;
      }

      // Display Validation Errors
      if (errors && errors.length > 0) {
        html += `<div class="error-message"><ul>`;
        errors.forEach((error) => {
          html += `<li>${error.msg}</li>`;
        });
        html += `</ul></div>`;
      }

      // Add the main heading
      html += `<h1>Manage Users</h1>`;

      // Add the table
      html += `
          <div class="table-wrapper">
              <table>
                  <thead>
                      <tr>
                          <th>First Name</th>
                          <th>Last Name</th>
                          <th>Email</th>
                          <th>Account Type</th>
                          <th>Action</th>
                      </tr>
                  </thead>
                  <tbody>
      `;

      // Loop through users and add rows to the table
      users.forEach((user) => {
        html += `
              <tr>
                  <td>${user.account_firstname}</td>
                  <td>${user.account_lastname}</td>
                  <td>${user.account_email}</td>
                  <td>${user.account_type}</td>
                  <td>
                      <form action="/account/delete-user/${user.account_id}" method="post" onsubmit="return confirm('Are you sure you want to delete this user?');">
                          <button type="submit" class="delete-button">
                              <i class="fa fa-trash-o"></i> Delete
                          </button>
                      </form>
                  </td>
              </tr>
          `;
      });

      html += `</tbody></table></div>`;

      // Add the back button
      html += `
          <p class="manage-ac">
              <a href="/account/" class="back-button">
                  <i class="fa fa-arrow-left" aria-hidden="true"></i>
                  Back to Account Management
              </a>
          </p>
      `;

      html += "</div>";
      return html;
    },



      /* **************************************
       * Build the order history view HTML
       * ************************************ */
      Util.buildOrderHistoryView = async (orderHistory, messages) => {
        let html = '<div class="order-history-container">';

        // Add the main heading
        html += `<h1>Order History</h1>`;

        // Display Flash Messages
        if (messages && messages.success) {
          html += `<div class="success-message">${messages.success}</div>`;
        }

        if (messages && messages.error) {
          html += `<div class="error-message">${messages.error}</div>`;
        }

        // Add the "Delete All History" button
        // html += `
        //     <form action="/account/delete-all-history" method="post" onsubmit="return confirm('Are you sure you want to delete ALL history? This action cannot be undone.');">
        //         <button type="submit" class="delete-all-button">Delete All History</button>
        //     </form>
        // `;

        // Check if there are orders
        if (orderHistory.length > 0) {
          html += `
              <table>
                  <thead>
                      <tr>
                          <th>Vehicle</th>
                          <th>Price</th>
                          <th>Year</th>
                          <th>Mileage</th>
                          <th>Color</th>
                          <th>Order Date</th>
                          <th>Current Status</th>
                          <th>Status History</th>
                      </tr>
                  </thead>
                  <tbody>
          `;

          // Loop through orders and add rows to the table
          orderHistory.forEach((order) => {
            html += `
                  <tr>
                      <td>
                          <img src="${order.inv_image}" alt="${order.inv_make} ${order.inv_model}">
                          <div>${order.inv_make} ${order.inv_model}</div>
                      </td>
                      <td>$${new Intl.NumberFormat("en-US").format(order.inv_price)}</td>
                      <td>${order.inv_year}</td>
                      <td>${new Intl.NumberFormat("en-US").format(order.inv_miles)} miles</td>
                      <td>${order.inv_color}</td>
                      <td>${new Date(order.order_date).toLocaleDateString()}</td>
                      <td>${order.current_status}</td>
                      <td>
            `;

            // Add status history if available
            if (order.history_status) {
              html += `
                          <div class="status-history">
                              <p><strong>${order.history_status}</strong></p>
                              <p>Changed on: ${new Date(order.status_change_date).toLocaleDateString()}</p>
                              <p>Changed by: ${order.account_firstname} ${order.account_lastname}</p>
                          </div>
              `;
            } else {
              html += `<p>No status changes recorded.</p>`;
            }

            // html += `
            //           </td>
            //           <td>
            //               <form action="/account/delete-history-item" method="post" onsubmit="return confirm('Are you sure you want to delete this history item?');">
            //                   <input type="hidden" name="history_id" value="${order.history_id}">
            //                   <button type="submit" class="delete-button">Delete</button>
            //               </form>
            //           </td>
            //       </tr>
            // `;
          });

          html += `</tbody></table>`;
        } else {
          html += `<p>No order history found.</p>`;
        }

        html += "</div>";
        return html;
      },




    /* **************************************
    * Build the admin contact submissions view HTML
    * ************************************ */
    Util.buildAdminContactSubmissionsView = async (submissions, messages) => {
      let html = '<div class="submissions-container">';

      // Add the main heading
      html += `<h1>All Contact Submissions</h1>`;

      // Display Flash Messages
      if (messages?.success) {
          html += `<div class="success-message">${messages.success}</div>`;
      }

      if (messages?.error) {
          html += `<div class="error-message">${messages.error}</div>`;
      }

      // Check if there are submissions
      if (submissions.length > 0) {
          html += `<div class="submissions-list">`;

          // Loop through submissions and create responsive cards
          submissions.forEach(submission => {
              html += `
                  <div class="submission-card">
                      <div class="submission-header">
                          <span class="submission-date">${new Date(submission.contact_date).toLocaleDateString()}</span>
                          <form action="/account/delete-contact-submission" method="post" onsubmit="return confirm('Are you sure you want to delete this submission?');">
                              <input type="hidden" name="contact_id" value="${submission.contact_id}">
                              <button type="submit" class="delete-button">
                               <i class="fa fa-trash-o"></i> Delete
                               </button>
                          </form>
                      </div>
                      <div class="submission-body">
                          <h3>${submission.contact_name}</h3>
                          <p><strong>Email:</strong> ${submission.contact_email}</p>
                          <p><strong>Message:</strong> ${submission.contact_message}</p>
                          <div class="submission-file">
              `;

              // Add file link if available
              if (submission.contact_file) {
                  html += `<a href="${submission.contact_file}" target="_blank" class="file-link">📎 View File</a>`;
              } else {
                  html += `<span class="no-file">No file attached</span>`;
              }

              html += `
                          </div>
                      </div>
                  </div>
              `;
          });

          html += `</div>`;
      } else {
          html += `<p class="no-submissions">No contact submissions found.</p>`;
      }

      html += '</div>';
      return html;
  };



    /* **************************************
    * Build the user contact submissions view HTML
    * ************************************ */
    Util.buildUserContactSubmissionsView = async (submissions, messages) => {
      let html = '<div class="submissions-container">';

      // Add the main heading
      html += `<h1>My Contact Submissions</h1>`;

      // Display Flash Messages
      if (messages?.success) {
          html += `<div class="success-message">${messages.success}</div>`;
      }

      if (messages?.error) {
          html += `<div class="error-message">${messages.error}</div>`;
      }

      // Check if there are submissions
      if (submissions.length > 0) {
          html += `<div class="submissions-list">`;

          // Loop through submissions and create responsive cards
          submissions.forEach(submission => {
              html += `
                  <div class="submission-card">
                      <div class="submission-header">
                          <span class="submission-date">${new Date(submission.contact_date).toLocaleDateString()}</span>
                      </div>
                      <div class="submission-body">
                          <h3>${submission.contact_name}</h3>
                          <p><strong>Email:</strong> ${submission.contact_email}</p>
                          <p><strong>Message:</strong> ${submission.contact_message}</p>
                          <div class="submission-file">
              `;

              // Add file link if available
              if (submission.contact_file) {
                  html += `<a href="${submission.contact_file}" target="_blank" class="file-link">📎 View File</a>`;
              } else {
                  html += `<span class="no-file">No file attached</span>`;
              }

              html += `
                          </div>
                      </div>
                  </div>
              `;
          });

          html += `</div>`;
      } else {
          html += `<p class="no-submissions">No contact submissions found.</p>`;
      }

      html += '</div>';
      return html;
  };


module.exports = Util
