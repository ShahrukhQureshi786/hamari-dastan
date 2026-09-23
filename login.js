(() => {
  const config = window.HD_SUPABASE_CONFIG || {};
  const errorBox = document.getElementById('hd-login-error');
  const emailInput = document.getElementById('hd-login-email');
  const passwordInput = document.getElementById('hd-login-password');
  const submitButton = document.getElementById('hd-login-submit');
  const submitText = document.getElementById('hd-login-submit-text');
  const toggleButton = document.getElementById('hd-login-toggle');

  function showError(message) {
    errorBox.textContent = message;
    errorBox.classList.remove('hidden');
  }

  function clearError() {
    errorBox.textContent = '';
    errorBox.classList.add('hidden');
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    submitButton.classList.toggle('opacity-60', busy);
    submitButton.classList.toggle('cursor-not-allowed', busy);
    submitText.textContent = busy ? 'Checking access…' : 'Enter Our Forever Hub ❤️';
  }

  async function startLogin() {
    clearError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError('Email aur password dono enter karein.');
      return;
    }

    if (!window.supabase || !config.url || !config.publishableKey || config.url.includes('YOUR_')) {
      showError('Supabase configuration complete nahi hai.');
      return;
    }

    setBusy(true);

    try {
      const client = window.supabase.createClient(
        config.url,
        config.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );

      const { data: sessionData } = await client.auth.getSession();

      if (sessionData?.session) {
        window.location.replace('hub.html');
        return;
      }

      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data?.session) {
        throw new Error('Email ya password ghalat hai, ya account ko access nahi mila.');
      }

      window.location.replace('hub.html');
    } catch (error) {
      console.error(error);
      showError('Email ya password ghalat hai, ya account ko access nahi mila.');
      passwordInput.value = '';
      passwordInput.focus();
      setBusy(false);
    }
  }

  submitButton.addEventListener('click', startLogin);

  [emailInput, passwordInput].forEach(input => {
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        startLogin();
      }
    });
  });

  toggleButton.addEventListener('click', () => {
    const visible = passwordInput.type === 'text';
    passwordInput.type = visible ? 'password' : 'text';
    toggleButton.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
    toggleButton.innerHTML = `<i data-lucide="${visible ? 'eye' : 'eye-off'}" class="w-5 h-5"></i>`;
    lucide.createIcons();
  });

  (async () => {
    try {
      if (!window.supabase || !config.url || !config.publishableKey || config.url.includes('YOUR_')) {
        return;
      }

      const client = window.supabase.createClient(config.url, config.publishableKey);
      const { data } = await client.auth.getSession();

      if (data?.session) {
        window.location.replace('hub.html');
      }
    } catch (error) {
      console.error(error);
    }
  })();

  lucide.createIcons();
})();
