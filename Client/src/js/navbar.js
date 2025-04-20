document.addEventListener('DOMContentLoaded', function () {
    const homeLink = document.querySelector('li > a[href="/"]');
    const profileLink = document.querySelector('li > a[href="/profile"]');
    const loginLink = document.querySelector('li > a[href="/login"]');
    const signupLink = document.querySelector('li > a[href="/signup"]');
    const logoutLink = document.querySelector('li > a[href="/logout"]');
    const protectedLink = document.querySelector('li > a[href="/protected"]');

    if (homeLink) {
        homeLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = '/';
        });
    }

    if (profileLink) {
        profileLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = '/profile';
        });
    }

    if (loginLink) {
        loginLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = '/login';
        });
    }

    if (signupLink) {
        signupLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = '/signup';
        });
    }

    if (logoutLink) {
        logoutLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = '/logout';
        });
    }

    if (protectedLink) {
        protectedLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.location.href = '/protected';
        });
    }
});
