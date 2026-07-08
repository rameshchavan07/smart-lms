const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZhZmMyMjRhLTU5MzQtNGVlYy04MjgyLTgzMDg5Mzc0NDNjNiIsImlhdCI6MTc4MzQyOTMyNCwiZXhwIjoxNzgzNTE1NzI0fQ.Y9GwEl--9NM18enjxh2tqRCGNCEx8_9uX6o-3aolttM';
fetch('http://localhost:5000/api/courses/my-courses?limit=4', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(async r => {
  console.log(r.status);
  console.log(await r.text());
});
