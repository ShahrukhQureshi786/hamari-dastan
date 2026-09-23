(() => {
  const config = window.HD_SUPABASE_CONFIG || {};

  const errorBox =
    document.getElementById('hd-login-error');

  const emailInput =
    document.getElementById('hd-login-email');

  const passwordInput =
    document.getElementById('hd-login-password');

  const submitButton =
    document.getElementById('hd-login-submit');

  const submitText =
    document.getElementById('hd-login-submit-text');

  const toggleButton =
    document.getElementById('hd-login-toggle');


  /* =========================
     SHOW ERROR
  ========================= */

  function showError(message) {
    if (!errorBox) return;

    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }


  /* =========================
     CLEAR ERROR
  ========================= */

  function clearError() {
    if (!errorBox) return;

    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }


  /* =========================
     BUTTON LOADING
  ========================= */

  function setBusy(busy) {
    if (!submitButton || !submitText) return;

    submitButton.disabled = busy;

    submitButton.classList.toggle(
      'opacity-60',
      busy
    );

    submitButton.classList.toggle(
      'cursor-not-allowed',
      busy
    );

    submitText.textContent = busy
      ? 'Checking access…'
      : 'Enter Our Forever Hub ❤️';
  }


  /* =========================
     SUPABASE CLIENT
  ========================= */

  function createClient() {
    if (
      !window.supabase ||
      !config.url ||
      !config.publishableKey ||
      config.url.includes('YOUR_')
    ) {
      return null;
    }

    return window.supabase.createClient(
      config.url,
      config.publishableKey,
      {
        auth: {
          persistSession: true,
          storage: window.sessionStorage,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }


  /* =========================
     LOGIN
  ========================= */

  async function startLogin() {
    clearError();

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;


    if (!email || !password) {
      showError(
        'Email aur password dono enter karein.'
      );

      return;
    }


    const client = createClient();

    if (!client) {
      showError(
        'Supabase configuration complete nahi hai.'
      );

      return;
    }


    setBusy(true);


    try {
      const {
        data,
        error
      } = await client.auth.signInWithPassword({
        email: email,
        password: password
      });


      if (
        error ||
        !data ||
        !data.session
      ) {
        throw new Error(
          'Email ya password ghalat hai, ya account ko access nahi mila.'
        );
      }


      window.location.replace(
        'hub.html'
      );

    } catch (error) {
      console.error(error);

      showError(
        'Email ya password ghalat hai, ya account ko access nahi mila.'
      );

      passwordInput.value = '';
      passwordInput.focus();

      setBusy(false);
    }
  }


  /* =========================
     LOGIN BUTTON
  ========================= */

  if (submitButton) {
    submitButton.addEventListener(
      'click',
      startLogin
    );
  }


  /* =========================
     ENTER KEY
  ========================= */

  [emailInput, passwordInput].forEach(
    input => {
      if (!input) return;

      input.addEventListener(
        'keydown',
        event => {
          if (event.key === 'Enter') {
            startLogin();
          }
        }
      );
    }
  );


  /* =========================
     SHOW / HIDE PASSWORD
  ========================= */

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener(
      'click',
      () => {
        const isVisible =
          passwordInput.type === 'text';

        passwordInput.type =
          isVisible
            ? 'password'
            : 'text';


        toggleButton.setAttribute(
          'aria-label',
          isVisible
            ? 'Show password'
            : 'Hide password'
        );


        toggleButton.innerHTML = `
          <i
            data-lucide="${
              isVisible
                ? 'eye'
                : 'eye-off'
            }"
            class="w-5 h-5">
          </i>
        `;


        if (
          window.lucide &&
          typeof lucide.createIcons === 'function'
        ) {
          lucide.createIcons();
        }
      }
    );
  }


  /* =========================
     CHECK EXISTING SESSION
  ========================= */

  (async () => {
    try {
      const client =
        createClient();

      if (!client) {
        return;
      }


      const {
        data,
        error
      } = await client.auth.getSession();


      if (
        !error &&
        data &&
        data.session
      ) {
        window.location.replace(
          'hub.html'
        );
      }

    } catch (error) {
      console.error(error);
    }
  })();


  /* =========================
     INITIAL ICONS
  ========================= */

  if (
    window.lucide &&
    typeof lucide.createIcons === 'function'
  ) {
    lucide.createIcons();
  }

})();
