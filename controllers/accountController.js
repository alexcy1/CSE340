
const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
require("dotenv").config()
const invModel = require("../models/inventory-model")



/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav();
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    account_email: "",
    messages: req.flash(),
  });
}



/* ****************************************
*  Deliver registration view
* *************************************** */
async function buildRegister(req, res, next) {
  let nav = await utilities.getNav()
  res.render("account/register", {
    title: "Register",
    nav,
    errors: null,
  })
}



/****************************************
 *  Process Registration
 * *************************************** */
async function registerAccount(req, res) {
  const { account_firstname, account_lastname, account_email, account_password } = req.body

  // Hash the password
  let hashedPassword
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10)
    // Hash the password using the salt
    hashedPassword = await bcrypt.hash(account_password, salt)
    console.log("Password hashed successfully")
  } catch (error) {
    console.error("Error in password hashing:", error)
    req.flash("error", "Error registering account.")
    const nav = await utilities.getNav()
    res.status(500).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
    return
  }

  const regResult = await accountModel.registerAccount(
    account_firstname,
    account_lastname,
    account_email,
    hashedPassword,
  )

  if (regResult) {
    req.flash("success", `Congratulations, you're registered ${account_firstname}. Please log in.`)
    res.redirect("/account/login")
  } else {
    const nav = await utilities.getNav()
    req.flash("error", "Sorry, the registration failed.")
    res.status(501).render("account/register", {
      title: "Registration",
      nav,
      errors: null,
    })
  }
}



/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  console.log("Login process started")
  const { account_email, account_password } = req.body
  console.log(`Attempting login for email: ${account_email}`)

  try {
    const accountData = await accountModel.getAccountByEmail(account_email)
    console.log("Account data retrieved:", accountData ? "Found" : "Not Found")

    if (!accountData) {
      console.log("Account not found, sending error response")
      req.flash("error", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav: await utilities.getNav(),
        errors: null,
        account_email,
        messages: req.flash(),
      })
    }

    console.log("Comparing passwords")
    const passwordsMatch = await bcrypt.compare(account_password, accountData.account_password)
    console.log("Passwords match:", passwordsMatch)

    if (passwordsMatch) {
      console.log("Passwords match, creating JWT")
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      req.flash("success", "You have successfully logged in.")
      console.log("JWT created and set in cookie, redirecting to /account/")
      return res.redirect("/account/")
    } else {
      console.log("Passwords do not match, sending error response")
      req.flash("error", "Please check your credentials and try again.")
      return res.status(400).render("account/login", {
        title: "Login",
        nav: await utilities.getNav(),
        errors: null,
        account_email,
        messages: req.flash(),
      })
    }
  } catch (error) {
    console.error("Login error:", error)
    req.flash("error", "An error occurred during login. Please try again.")
    return res.status(500).render("account/login", {
      title: "Login",
      nav: await utilities.getNav(),
      errors: null,
      account_email,
      messages: req.flash(),
    })
  }
}



/* ****************************************
 *  Deliver Account Management View
 * ************************************ */
async function buildAccountManagement(req, res, next) {
  console.log("Building account management view");
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  res.render("account/management", {
    title: "Account Management",
    nav,
    errors: null,
    messages: req.flash(),
    accountData,
  });
}



/* ****************************************
 *  Deliver Account Update View
 * ************************************ */
async function buildAccountUpdate(req, res, next) {
  const nav = await utilities.getNav();
  const accountId = Number.parseInt(req.params.accountId);
  const accountData = await accountModel.getAccountById(accountId);

  res.render("account/update", {
    title: "Update Account",
    nav,
    errors: null,
    accountData,
    messages: req.flash(),
  });
}



/* ****************************************
 *  Process Account Update
 * ************************************ */
async function updateAccount(req, res, next) {
  const { account_id, account_firstname, account_lastname, account_email } = req.body;

  const errors = [];
  if (!account_firstname) errors.push({ msg: "First name is required." });
  if (!account_lastname) errors.push({ msg: "Last name is required." });
  if (!account_email) errors.push({ msg: "Email is required." });

  if (errors.length > 0) {
    const nav = await utilities.getNav();
    return res.render("account/update", {
      title: "Update Account",
      nav,
      errors,
      accountData: { account_id, account_firstname, account_lastname, account_email },
      messages: req.flash(),
    });
  }

  const updateResult = await accountModel.updateAccount(account_id, account_firstname, account_lastname, account_email);

  if (updateResult) {
    const updatedAccountData = {
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      account_type: res.locals.accountData.account_type,
    };

    const accessToken = jwt.sign(updatedAccountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 });
    res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 });

    req.flash("success", "Account updated successfully.");
    res.redirect("/account/");
  } else {
    req.flash("error", "Sorry, the account update failed.");
    res.redirect(`/account/update/${account_id}`);
  }
}



/* ****************************************
 *  Process Password Change
 * ************************************ */
async function changePassword(req, res, next) {
  const { account_id, account_password } = req.body;

  // Hash the new password
  let hashedPassword;
  try {
    const salt = await bcrypt.genSalt(10);
    hashedPassword = await bcrypt.hash(account_password, salt);
  } catch (error) {
    console.error("Error hashing password:", error);
    req.flash("error", "Error changing password.");
    return res.redirect(`/account/update/${account_id}`);
  }

  // Update password in the database
  const updateResult = await accountModel.updatePassword(account_id, hashedPassword);

  if (updateResult) {
    // Clear JWT cookie and redirect to login page
    res.clearCookie("jwt");
    req.flash("success", "Password changed successfully. Please log in with your new password.");
    res.redirect("/account/login");
  } else {
    req.flash("error", "Sorry, the password change failed.");
    res.redirect(`/account/update/${account_id}`);
  }
}



async function buildChangePassword(req, res, next) {
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  res.render("account/change-password", {
    title: "Change Password",
    nav,
    errors: null,
    accountData,
    messages: req.flash(),
  });
}


/* ****************************************
 *  Process logout request
 * ************************************ */
async function logoutAccount(req, res) {
  res.clearCookie("jwt")
  res.redirect("/")
}



// =========================== MY PROJECT IN VIEW =============================

/* ****************************************
 *  Deliver Manage Users View (Admin Only)
 * ************************************ */
async function buildManageUsers(req, res, next) {
  const nav = await utilities.getNav();
  const accountData = res.locals.accountData;

  // Fetch all users from the database
  const users = await accountModel.getAllUsers();

  // Build the manage users view HTML
  const manageUsersView = await utilities.buildManageUsersView(users, req.flash(), req.errors || []);

  res.render("account/manage-users", {
    title: "Manage Users",
    nav,manageUsersView,
    errors: null,
    messages: req.flash(),
    accountData,
    users,
  });
}


/* ****************************************
 *  Delete a User (Admin Only)
 * ************************************ */
async function deleteUser(req, res, next) {
  const accountId = req.params.accountId;

  // Delete the user from the database
  const deleteResult = await accountModel.deleteUserById(accountId);

  if (deleteResult) {
    req.flash("success", "User deleted successfully.");
  } else {
    req.flash("error", "Sorry, the user deletion failed.");
  }

  res.redirect("/account/manage-users");
}



/****************************************
// PLACE ORDER
****************************************/
async function placeOrder(req, res) {
  const { inv_id } = req.body;
  const account_id = res.locals.accountData.account_id;

  const order = await invModel.createOrder(account_id, inv_id);

  if (order) {
    req.flash("success", "Order placed successfully.");
    res.redirect("/account/orders");
  } else {
    req.flash("error", "Failed to place order.");
    res.redirect("/inv/detail/" + inv_id);
  }
}



/****************************************
// View Orders
****************************************/
async function viewOrders(req, res) {
  const account_id = res.locals.accountData.account_id;
  const orders = await invModel.getOrdersByAccountId(account_id);
  const statuses = await invModel.getOrderStatuses();
  const userOrdersView = await utilities.buildUserOrders(orders);
  const nav = await utilities.getNav();

  res.render("account/orders", {
    title: "My Orders",
    nav,
    orders,
    statuses,
    userOrdersView,
    errors: null,
    messages: req.flash(),
  });
}



/****************************************
// Manage Orders
****************************************/
async function manageOrders(req, res) {
  const orders = await invModel.getAllOrders();
  const statuses = await invModel.getOrderStatuses();
  const manageOrdersView = await utilities.buildManageOrders(orders, statuses);
  const nav = await utilities.getNav();

  res.render("account/manage-orders", {
    title: "Manage Orders",
    nav,
    orders,
    statuses,
    manageOrdersView,
    errors: null,
    messages: req.flash(),
  });
}



/****************************************
 * Update the status of an order.
 ****************************************/
async function updateOrder(req, res) {
  const { order_id, status_id, user_id } = req.body;

  if (!order_id || !status_id || !user_id) {
    req.flash("error", "Invalid order data.");
    return res.redirect("/account/user-list");
  }

  try {
    const result = await invModel.updateOrderStatus(order_id, status_id);

    if (result.success) {
      req.flash("success", result.message);
    } else {
      req.flash("error", result.message);
    }
  } catch (error) {
    console.error("Error updating order status:", error);
    req.flash("error", "An error occurred while updating the order status.");
  }

  res.redirect(`/account/manage-orders/${user_id}`);
}



/****************************************
// Delete Order
****************************************/
async function deleteOrder(req, res) {
  const { order_id } = req.body;
  const account_id = res.locals.accountData.account_id;
  const account_type = res.locals.accountData.account_type;

  try {
    const order = await invModel.getOrderById(order_id);

    if (!order) {
      req.flash("error", "Order not found.");
      return res.redirect("/account/orders");
    }

    if (account_type === "Client" && order.status_name !== "Pending") {
      req.flash("error", "You can only delete orders that are pending.");
      return res.redirect("/account/orders");
    }

    const deleteResult = await invModel.deleteOrder(order_id);

    if (deleteResult) {
      req.flash("success", "Order deleted successfully.");
    } else {
      req.flash("error", "Failed to delete order.");
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    req.flash("error", "An error occurred while deleting the order.");
  }

  if (account_type === "Admin" || account_type === "Employee") {
    res.redirect("/account/manage-orders");
  } else {
    res.redirect("/account/orders");
  }
}



/****************************************
// VIEW Order History
****************************************/
async function viewOrderHistory(req, res) {
  const account_id = res.locals.accountData.account_id;
  const account_type = res.locals.accountData.account_type;

  try {
    const orderHistory = await invModel.getOrderHistory(
      account_type === "Admin" ? null : account_id
    );

    const nav = await utilities.getNav();
    const orderHistoryView = await utilities.buildOrderHistoryView(orderHistory, req.flash());

    res.render("account/order-history", {
      title: "Order History",
      nav,
      orderHistoryView,
      orderHistory,
      errors: null,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    req.flash("error", "An error occurred while fetching order history.");
    res.redirect("/account/");
  }
}



/****************************************
 * Delete a specific history item.
****************************************/
async function deleteHistoryItem(req, res) {
  const { history_id } = req.body;

  console.log("Received history_id:", history_id); // Debugging

  if (!history_id || isNaN(history_id)) {
    console.error("Invalid history_id:", history_id); // Debugging
    req.flash("error", "Invalid history item ID.");
    return res.redirect("/account/order-history");
  }

  try {
    const result = await invModel.deleteHistoryItem(Number.parseInt(history_id, 10));

    if (result.success) {
      req.flash("success", result.message);
    } else {
      req.flash("error", result.message);
    }
  } catch (error) {
    console.error("Error deleting history item:", error);
    req.flash("error", "An error occurred while deleting the history item.");
  }

  res.redirect("/account/order-history");
}



/****************************************
 * Delete all history items for the user or all users (for admins).
 /****************************************/
async function deleteAllHistory(req, res) {
  const account_id = res.locals.accountData.account_id;
  const account_type = res.locals.accountData.account_type;

  try {
    const result = await invModel.deleteAllHistory(account_type === "Admin" ? null : account_id);

    if (result.success) {
      req.flash("success", result.message);
      if (result.count === 0) {
        req.flash("info", "No history items were deleted. This may be because all orders are still active.");
      }
    } else {
      req.flash("error", result.message);
    }
  } catch (error) {
    console.error("Error deleting all history items:", error);
    req.flash("error", "An error occurred while deleting history items.");
  }

  res.redirect("/account/order-history");
}



/****************************************
 * Display the list of users who have placed orders.
****************************************/
async function viewUserList(req, res) {
  try {
    const users = await accountModel.getUsersWithOrders();
    const nav = await utilities.getNav();

    const userListView = await utilities.buildUserListView(users, req.flash());

    res.render("account/user-list", {
      title: "User List - Users with Orders",
      nav,
      userListView,
      users,
      errors: null,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching user list:", error);
    req.flash("error", "An error occurred while fetching the user list.");
    res.redirect("/account/");
  }
}



/****************************************
 * Display the orders for a specific user.
 ****************************************/
async function viewUserOrders(req, res) {
  const user_id = req.params.userId;
  console.log("Fetching orders for user ID:", user_id); // Debugging

  try {
    const user = await accountModel.getAccountById(user_id);
    console.log("User details:", user); // Debugging

    if (!user) {
      req.flash("error", "User not found.");
      return res.redirect("/account/user-list");
    }

    const orders = await invModel.getOrdersByAccountId(user_id);
    console.log("Orders for user:", orders); // Debugging

    const statuses = await invModel.getOrderStatuses();
    console.log("Statuses:", statuses); // Debugging

    const manageOrdersView = await utilities.buildManageOrders(orders, statuses, user);
    console.log("Manage Orders View:", manageOrdersView); // Debugging

    const nav = await utilities.getNav();

    res.render("account/manage-orders", {
      title: "Manage Orders",
      nav,
      manageOrdersView,
      errors: null,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    req.flash("error", "An error occurred while fetching the user orders.");
    res.redirect("/account/user-list");
  }
}



/**===========================================
 * Display the contact form.
 =============================================*/
async function buildContactForm(req, res) {
  const nav = await utilities.getNav();
  res.render("account/contact", {
    title: "Contact Us",
    nav,
    errors: null,
    messages: req.flash(),
  });
}


/**===========================================
 * Process the contact form submission.
=============================================*/
async function submitContactForm(req, res) {
  const { contact_name, contact_email, contact_message } = req.body;
  const account_id = res.locals.accountData?.account_id || null;
  const contact_file = req.file ? `/images/contact/${req.file.filename}` : null; // Correct file path

  try {
    const result = await accountModel.submitContactForm(account_id, contact_name, contact_email, contact_message, contact_file);

    if (result) {
      req.flash("success", "Your message has been submitted successfully.");
    } else {
      req.flash("error", "An error occurred while submitting your message.");
    }
  } catch (error) {
    console.error("Error submitting contact form:", error);
    req.flash("error", "An error occurred while submitting your message.");
  }

  res.redirect("/account/contact");
}



/****************************************
 * Display all contact submissions for a user.
/****************************************/
async function viewUserContactSubmissions(req, res) {
  const account_id = res.locals.accountData.account_id;
  const nav = await utilities.getNav();

  try {
    const submissions = await accountModel.getUserContactSubmissions(account_id);
     // Build the contact submissions view HTML
     const submissionsView = await utilities.buildUserContactSubmissionsView(submissions, req.flash());

    res.render("account/user-contact-submissions", {
      title: "My Contact Submissions",
      nav,
      submissions,
      submissionsView,
      errors: null,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    req.flash("error", "An error occurred while fetching your contact submissions.");
    res.redirect("/account/");
  }
}



/**===========================================
 * Display all contact submissions (Admin only).
 =============================================*/
async function viewAllContactSubmissions(req, res) {
  const nav = await utilities.getNav();

  try {
    const submissions = await accountModel.getAllContactSubmissions();
    const submissionsView = await utilities.buildAdminContactSubmissionsView(submissions, req.flash());

    res.render("account/admin-contact-submissions", {
      title: "All Contact Submissions",
      nav,
      submissions,
      submissionsView,
      errors: null,
      messages: req.flash(),
    });
  } catch (error) {
    console.error("Error fetching contact submissions:", error);
    req.flash("error", "An error occurred while fetching contact submissions.");
    res.redirect("/account/");
  }
}



/**===========================================
 * Delete a contact submission (Admin only).
=============================================*/
async function deleteContactSubmission(req, res) {
  const { contact_id } = req.body;

  try {
    const result = await accountModel.deleteContactSubmission(contact_id);

    if (result) {
      req.flash("success", "Contact submission deleted successfully.");
    } else {
      req.flash("error", "Failed to delete contact submission.");
    }
  } catch (error) {
    console.error("Error deleting contact submission:", error);
    req.flash("error", "An error occurred while deleting the contact submission.");
  }

  res.redirect("/account/admin/contact-submissions");
}


module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  buildAccountManagement,
  accountLogin,
  logoutAccount,
  buildAccountUpdate,
  updateAccount,
  changePassword,
  buildChangePassword,

  buildManageUsers,
  deleteUser,

  placeOrder,
  viewOrders,
  manageOrders,
  updateOrder,
  deleteOrder,
  viewOrderHistory,
  deleteHistoryItem,
  deleteAllHistory,

  viewUserList,
  viewUserOrders,

  buildContactForm,
  submitContactForm,
  viewUserContactSubmissions,
  viewAllContactSubmissions,
  deleteContactSubmission
}
