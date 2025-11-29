const express = require('express');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const dataFile = path.join(__dirname, 'students.json');

// helper: read file safely
async function readStudents(){
  try{
    const s = await fs.readJson(dataFile);
    if (!Array.isArray(s)) return [];
    return s;
  } catch(err){
    // if file not present or invalid, return empty array
    return [];
  }
}

// GET all
app.get('/students', async (req, res) => {
  const students = await readStudents();
  res.json(students);
});

// POST add
app.post('/students', async (req, res) => {
  const students = await readStudents();
  // simple validation
  const newStudent = req.body;
  if(!newStudent || !newStudent.id) return res.status(400).json({ error: 'Student must have id' });

  // prevent duplicate id
  const exists = students.find(s => String(s.id) === String(newStudent.id));
  if(exists) return res.status(409).json({ error: 'Student with this id already exists' });

  students.push(newStudent);
  await fs.writeJson(dataFile, students, { spaces: 2 });
  res.json({ message: 'Student added' });
});

// PUT update
app.put('/students/:id', async (req, res) => {
  const id = req.params.id;
  const students = await readStudents();
  const idx = students.findIndex(s => String(s.id) === String(id));
  if(idx === -1) return res.status(404).json({ error: 'Not found' });

  // merge/update
  students[idx] = req.body;
  await fs.writeJson(dataFile, students, { spaces: 2 });
  res.json({ message: 'Updated' });
});

// DELETE
app.delete('/students/:id', async (req, res) => {
  const id = req.params.id;
  let students = await readStudents();
  const before = students.length;
  students = students.filter(s => String(s.id) !== String(id));
  if(students.length === before) return res.status(404).json({ error: 'Not found' });

  await fs.writeJson(dataFile, students, { spaces: 2 });
  res.json({ message: 'Deleted' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
