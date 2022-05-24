/*eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts.mjs';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:8000/api/v1/users/login',
      data: {
        email: email,
        password: password,
      },
    });
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully');
      setTimeout(() => {
        location.assign('/');
      }, 500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:8000/api/v1/users/logout',
    });
    console.log('res', res);
    if ((res.data.status = 'success')) {
      location.reload(true);
    }
  } catch (err) {
    console.log('err', err);
    showAlert('error', 'Error logging out! Try again.');
  }
};
