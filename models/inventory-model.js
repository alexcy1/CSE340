
const pool = require("../database/")


/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  return await pool.query("SELECT * FROM public.classification ORDER BY classification_name")
}


/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const data = await pool.query(
      `SELECT * FROM public.inventory AS i
        JOIN public.classification AS c
        ON i.classification_id = c.classification_id
        WHERE i.classification_id = $1`,
      [classification_id],
    )
    return data.rows
  } catch (error) {
    console.error("getclassificationsbyid error " + error)
  }
}


/* ***************************
 *  Get vehicle by inv_id
 * ************************** */
async function getVehicleById(inv_id) {
  try {
    const data = await pool.query(`SELECT * FROM public.inventory WHERE inv_id = $1`, [inv_id])
    return data.rows[0]
  } catch (error) {
    console.error("getvehiclebyid error " + error)
  }
}


/* ***************************
 *  Add new classification
 * ************************** */
async function addClassification(classification_name) {
  try {
    const sql = "INSERT INTO classification (classification_name) VALUES ($1) RETURNING *"
    const result = await pool.query(sql, [classification_name])
    return result.rows[0]
  } catch (error) {
    console.error("addclassification error " + error)
    return null
  }
}


/* ***************************
 *  Add new inventory item
 * ************************** */
async function addInventory(inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id) {
  try {
    const sql = "INSERT INTO inventory (inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
    const result = await pool.query(sql, [inv_make, inv_model, inv_year, inv_description, inv_image, inv_thumbnail, inv_price, inv_miles, inv_color, classification_id])
    return result.rows[0]
  } catch (error) {
    console.error("addInventory error " + error)
    return null
  }
}



/* ***************************
 *  Update Inventory Data
 * ************************** */
async function updateInventory(
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
) {
  try {
    const sql = `
      UPDATE inventory
      SET
        inv_make = $1,
        inv_model = $2,
        inv_year = $3,
        inv_description = $4,
        inv_image = COALESCE($5, inv_image),
        inv_thumbnail = COALESCE($6, inv_thumbnail),
        inv_price = $7,
        inv_miles = $8,
        inv_color = $9,
        classification_id = $10
      WHERE inv_id = $11
      RETURNING *`;
    const result = await pool.query(sql, [
      inv_make,
      inv_model,
      inv_year,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_price,
      inv_miles,
      inv_color,
      classification_id,
      inv_id
    ]);
    return result.rows[0];
  } catch (error) {
    console.error("updateInventory error: " + error);
    return null;
  }
}



/* ***************************
 *  Delete Inventory Item
 * ************************** */
async function deleteInventoryItem(inv_id) {
  try {
    const sql = 'DELETE FROM inventory WHERE inv_id = $1';
    const data = await pool.query(sql, [inv_id]);
    return data.rowCount; // Returns the number of rows deleted (1 if successful, 0 if not)
  } catch (error) {
    console.error("deleteInventoryItem error: " + error);
    return null;
  }
}


/* ***************************
 *  Delete Classification
 * ************************** */
async function deleteClassification(classification_id) {
  try {
    const sql = 'DELETE FROM classification WHERE classification_id = $1';
    const data = await pool.query(sql, [classification_id]);
    return data.rowCount; // Returns the number of rows deleted (1 if successful, 0 if not)
  } catch (error) {
    console.error("deleteClassification error: " + error);
    return null;
  }
}


module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  addInventory,
  updateInventory,
  deleteInventoryItem,
  deleteClassification
}
