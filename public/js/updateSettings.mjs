/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts.mjs';

export const updateSettings = async (data, type) => {
  try {
    const endpoint = type === 'password' ? 'updatePassword' : 'updateMyDetails';
    const res = await axios({
      method: 'PATCH',
      url: `http://localhost:8000/api/v1/users/${endpoint}`,
      data,
    });
    console.log(res, 'res', name);
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
      document.location.reload();
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
