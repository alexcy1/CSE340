// const form = document.querySelector("#updateForm");
// form.addEventListener("change", function () {
//   const updateBtn = document.querySelector("button");
//   updateBtn.removeAttribute("disabled");
// });



const form = document.querySelector("#editInventoryForm");
const updateBtn = document.querySelector("button[type='submit']");

// Enable the submit button when any form field changes
form.addEventListener("change", function () {
  updateBtn.removeAttribute("disabled");
});

// Optional: Enable the submit button when any form field is typed into
form.addEventListener("input", function () {
  updateBtn.removeAttribute("disabled");
});
