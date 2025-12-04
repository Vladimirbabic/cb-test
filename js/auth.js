let isLogin = true;

const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const toggleForm = document.getElementById('toggle-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMsg = document.getElementById('error-msg');

toggleForm.addEventListener('click', () => {
    isLogin = !isLogin;
    formTitle.innerText = isLogin ? 'Login' : 'Sign Up';
    submitBtn.innerText = isLogin ? 'Login' : 'Sign Up';
    toggleForm.innerText = isLogin ? 'Need an account? Sign Up' : 'Have an account? Login';
    errorMsg.style.display = 'none';
});

submitBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    errorMsg.style.display = 'none';

    if (!email || !password) {
        showError('Please enter email and password');
        return;
    }

    try {
        let error;
        if (isLogin) {
            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            error = signInError;
        } else {
            const { error: signUpError } = await supabase.auth.signUp({ email, password });
            error = signUpError;
            if (!error) {
                alert('Check your email for the confirmation link!');
                return;
            }
        }

        if (error) throw error;
        
        window.location.href = 'dashboard.html';
    } catch (err) {
        showError(err.message);
    }
});

function showError(msg) {
    errorMsg.innerText = msg;
    errorMsg.style.display = 'block';
}

// Check if already logged in
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
        window.location.href = 'dashboard.html';
    }
});

