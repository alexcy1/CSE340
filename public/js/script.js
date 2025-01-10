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

