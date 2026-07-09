
document.addEventListener("DOMContentLoaded", function () {
    const toggleButtons = document.querySelectorAll(".password-toggle-btn");

    toggleButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const targetId = button.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);
            const icon = button.querySelector("i");

            if (!passwordInput) {
                return;
            }

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                passwordInput.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });
});
