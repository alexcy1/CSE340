// Add smooth scrolling to navigation links
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('nav a');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.hash) {
                e.preventDefault();
                const target = document.querySelector(link.hash);
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});




// Add Form Toggler
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('account_password');
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        passwordField.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye');
    }
});



// Forces validation to trigger
document.querySelectorAll("input").forEach(input => {
    input.addEventListener("blur", () => {
        input.classList.add("blurred");
    });
});
