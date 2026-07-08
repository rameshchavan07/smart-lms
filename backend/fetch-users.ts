const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImRiZDdmZjAwLTEzNTktNDM2MC04ZjRhLTk4M2E4MTI5YmNlYSIsImlhdCI6MTc4MzQzMDIxNywiZXhwIjoxNzgzNTE2NjE3fQ.r3i_H009L_X26W91d4e0a4i_bU0w7c5lBv_Q8Xz_gYI'; // Admin token from previous steps

fetch('http://localhost:5000/api/users', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(async r => {
  const data = await r.json();
  console.log(data.users.map((u: any) => `${u.firstName} ${u.lastName} - ${u.role}`));
});
